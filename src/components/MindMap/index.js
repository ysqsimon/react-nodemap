import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { flextree } from 'd3-flextree';
import * as d3 from '../../js/d3';
import JSONData from '../../js/JSONData';
import History from '../../js/History';

import './index.scss';

class MindMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toRecord: true, // 判断是否需要记录mmdata的数据快照
      toUpdate: true, // 判断是否需要更新mmdata
      dTop: {}, // mmdata中纵坐标最高的数据
      mmdata: {}, // 思维导图数据
      root: {}, // 包含位置信息的mmdata
      showContextMenu: false,
      contextMenuX: 0,
      contextMenuY: 0,
      contextMenuItems: [{ title: '删除节点', command: 0 }],
      mindmap_svg: {},
      mindmap_g: {},
      dummy: {},
      mindmapSvgZoom: () => {},
      easePolyInOut: d3.transition().duration(1000).ease(d3.easePolyInOut),
      link: d3
        .linkHorizontal()
        .x((d) => d[0])
        .y((d) => d[1]),
      zoom: d3.zoom(),
      history: new History(),
      selectedElement: null,
    };
    this.mindmapRef = React.createRef();
    this.svgRef = React.createRef();
    this.contentRef = React.createRef();
    this.dummyRef = React.createRef();
    this.menuRef = React.createRef();
    this.gpsRef = React.createRef();
    this.fitViewRef = React.createRef();
    this.downloadRef = React.createRef();
    this.undoRef = React.createRef();
    this.redoRef = React.createRef();
  }

  async componentDidMount() {
    this.init();
    // this.mindmap_svg.on('mousedown', this.rightDragStart)
    // this.mindmap_svg.on('mousemove', this.rightDrag)
    // this.mindmap_svg.on('mouseup', this.rightDragEnd)
    this.updateData();
    await this.makeCenter();
    await this.fitContent();

    this.state.mindmap_g.style('opacity', 1);
    this.forceUpdate();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.value !== prevProps.value) {
      if (this.state.toUpdate) {
        const newData = new JSONData(this.props.value.data);
        // this.state.mmdata = newData;
        this.setState({
          mmdata: newData,
        });
        this.depthTraverse2(newData.data, this.getTextSize);
      } else {
        // this.state.toUpdate = true;
        this.setState({
          toUpdate: true,
        });
      }
    }
    if (this.state.mmdata !== prevState.mmdata) {
      this.updateData();
    }
    if (this.props.keyboard !== prevProps.keyboard) {
      this.makeKeyboard(this.props.keyboard);
    }
  }

  // methods
  updateData = () => {
    if (this.state.mmdata.data) {
      if (this.state.toRecord) {
        this.state.history.record(this.state.mmdata.data);
      }
      this.updateMindmap();
      this.state.toUpdate = false;
    }
  };

  init = () => {
    // 绑定元素
    this.state.mindmap_svg = d3.select(this.svgRef.current);
    this.state.mindmap_g = d3
      .select(this.contentRef.current)
      .style('opacity', 0);
    this.state.dummy = d3.select(this.dummyRef.current);
    // this.setState({
    //   mindmap_svg: d3.select(this.refs.svg),
    //   mindmap_g: d3.select(this.refs.content).style('opacity', 0),
    //   dummy: d3.select(this.refs.dummy)
    // }, () => {

    // })
    // 绑定事件
    this.makeKeyboard(this.props.keyboard);
    this.state.mindmap_svg.on('contextmenu', () => {
      d3.event.preventDefault();
    });
    this.state.mindmapSvgZoom = this.state.zoom
      .scaleExtent([0.1, 8])
      .on('zoom', () => {
        this.state.mindmap_g.attr('transform', d3.event.transform);
      });
    // this.setState({
    //   mindmapSvgZoom: this.state.zoom.scaleExtent([0.1, 8]).on('zoom', () => {
    //     this.state.mindmap_g.attr('transform', d3.event.transform)
    //   })
    // })
    this.makeZoom(this.props.zoomable);
  };

  initNodeEvent = () => {
    // 绑定节点事件
    this.makeDrag(this.props.draggable);
    this.makeNodeAdd(this.props.showNodeAdd);
    this.makeContextMenu(this.props.contextMenu);
    this.makeNodeClick(this.props.nodeClick);
  };

  canUndo = () => {
    return this.state.history.canUndo;
  };

  canRedo = () => {
    return this.state.history.canRedo;
  };

  // 事件
  makeKeyboard = (val) => {
    this.state.mindmap_svg.on('keydown', val ? this.svgKeyDown : null);
  };

  makeNodeAdd = (val) => {
    const fObject = this.state.mindmap_g.selectAll('foreignObject');
    const gBtn = this.state.mindmap_g.selectAll('.gButton');

    if (val) {
      const { mouseLeave, mouseEnter, gBtnClick } = this;

      fObject.on('mouseenter', mouseEnter).on('mouseleave', mouseLeave);
      gBtn
        .on('mouseenter', mouseEnter)
        .on('mouseleave', mouseLeave)
        .on('click', gBtnClick);
    } else {
      fObject.on('mouseenter', null).on('mouseleave', null);
      gBtn.on('mouseenter', null).on('mouseleave', null).on('click', null);
    }
  };

  makeContextMenu = (val) => {
    this.state.mindmap_g
      .selectAll('foreignObject')
      .on('contextmenu', val ? this.fObjectRightClick : null);
  };

  makeDrag = (val) => {
    const { mindmap_g } = this.state;
    if (val) {
      const { dragged, dragended } = this;
      mindmap_g
        .selectAll('foreignObject')
        .filter((d) => d.depth !== 0) // 非根节点才可以拖拽
        .call(
          d3
            .drag()
            .container((d, i, n) => n[i].parentNode.parentNode)
            .on('drag', dragged)
            .on('end', dragended)
        );
    } else {
      mindmap_g
        .selectAll('foreignObject')
        .call(d3.drag().on('drag', null).on('end', null));
    }
  };

  makeNodeClick = (val) => {
    this.state.mindmap_g
      .selectAll('foreignObject')
      .on('click', val ? this.fObjectClick : null);
  };

  makeZoom = (val) => {
    const { mindmap_svg, mindmapSvgZoom } = this.state;
    if (val) {
      mindmap_svg.call(mindmapSvgZoom).on('dblclick.zoom', null);
    } else {
      mindmap_svg.on('.zoom', null);
    }
  };

  // button事件
  undo = () => {
    const prev = this.state.history.undo();
    // this.state.toRecord = false;
    // this.state.mmdata = new JSONData(prev);
    this.setState({
      toRecord: false,
      mmdata: new JSONData(prev),
    });
  };

  redo = () => {
    const next = this.state.history.redo();
    this.setState({
      toRecord: false,
      mmdata: new JSONData(next),
    });
  };

  exportImage() {
    // 导出png：待解决
  }

  makeCenter = async () => {
    // 居中
    await d3
      .transition()
      .end()
      .then(() => {
        if (this.contentRef.current) {
          const div = this.mindmapRef.current;
          const content = this.contentRef.current.getBBox();
          const { k } = d3.zoomTransform(this.svgRef.current);

          const x = -(div.offsetWidth - k * content.width) / (2 * k) - 5;
          const y =
            -(div.offsetHeight - k * content.height) / (2 * k) -
            (-this.state.dTop.x - this.foreignY(this.state.dTop));

          this.state.mindmap_svg.call(this.state.zoom.translateTo, x, y, [
            0,
            0,
          ]);
        }
      });
  };

  fitContent = async () => {
    // 适应窗口大小
    await d3
      .transition()
      .end()
      .then(() => {
        if (this.contentRef.current) {
          const rect = this.contentRef.current.getBBox();
          const div = this.mindmapRef.current;

          const multipleX = div.offsetWidth / rect.width;
          const multipleY = div.offsetHeight / rect.height;
          const multiple = Math.min(multipleX, multipleY) * 0.8;

          this.state.mindmap_svg
            .transition(this.state.easePolyInOut)
            .call(this.state.zoom.scaleTo, multiple);
        }
      });
  };

  // 数据操作
  add = async (dParent, d) => {
    this.state.toRecord = true;

    const newData = new JSONData(this.state.mmdata.data);
    newData.add(dParent, d);
    this.depthTraverse2(newData.data, this.getTextSize);
    this.setState({
      mmdata: newData,
    });
    this.props.change(newData.getPuredata());
  };

  insert = async (dPosition, d, i = 0) => {
    this.state.toRecord = true;

    const newData = new JSONData(this.state.mmdata.data);
    newData.insert(dPosition, d, i);
    this.depthTraverse2(newData.data, this.getTextSize);
    this.setState({
      mmdata: newData,
    });
    this.props.change(newData.getPuredata());
  };

  del = async (s) => {
    if (this.state.selectedElement) {
      this.state.selectedElement.remove(); // 使动画流畅
    }

    this.state.toRecord = true;

    const newData = new JSONData(this.state.mmdata.data);
    newData.del(s);

    this.depthTraverse2(newData.data, this.getTextSize);
    this.setState({
      mmdata: newData,
    });
    this.props.change(newData.getPuredata());
  };

  updateName = (d, name) => {
    this.state.toRecord = true;
    const newData = new JSONData(this.state.mmdata.data);
    newData.update(d.data, name);

    this.depthTraverse2(newData.data, this.getTextSize);
    this.setState({
      mmdata: newData,
    });
    this.props.change(newData.getPuredata());
  };

  // 右键拖拽
  rightDragStart() {}

  rightDrag() {}

  rightDragEnd() {}

  // 键盘
  svgKeyDown() {
    const sele = d3.select('#selectedNode');
    if (!sele.node()) {
      return;
    }

    const seleData = sele.data()[0];
    const seleRawData = sele.data()[0].data;
    const pNode = sele.node().parentNode;
    const newJSON = { name: '新建节点', children: [] };
    const keyName = d3.event.key;

    if (keyName === 'Tab') {
      // 添加子节点
      d3.event.preventDefault();
      this.add(seleRawData, newJSON);
      this.editNew(newJSON, seleData.depth + 1, pNode);
    } else if (keyName === 'Enter') {
      // 添加弟弟节点
      d3.event.preventDefault();
      if (pNode.isSameNode(this.contentRef.current)) {
        this.add(seleRawData, newJSON); // 根节点enter时，等效tab
        this.editNew(newJSON, seleData.depth + 1, pNode);
      } else {
        this.insert(seleRawData, newJSON, 1);
        this.editNew(newJSON, seleData.depth, pNode);
      }
    } else if (keyName === 'Backspace') {
      // 删除节点
      d3.event.preventDefault();
      this.del(seleRawData);
    }
  }

  divKeyDown = () => {
    if (d3.event.key === 'Enter') {
      // d3.event.preventDefault()
      // document.execCommand('insertHTML', false, '<br>')
    }
  };

  // 节点操作
  updateNodeName = () => {
    // 文本编辑完成时
    const editP = document.querySelector('#editing > foreignObject > div');
    window.getSelection().removeAllRanges(); // 清除选中
    const editText = editP.innerText;
    d3.select('g#editing').each((d, i, n) => {
      n[i].removeAttribute('id');
      editP.setAttribute('contenteditable', false);
      this.updateName(d, editText);
    });
  };

  removeSelectedNode = () => {
    const sele = this.state.selectedElement;
    if (sele) {
      sele.removeAttribute('id');
    }
  };

  selectNode = (n) => {
    // 选中节点
    if (n.getAttribute('id') !== 'selectedNode') {
      this.removeSelectedNode();
      d3.select(n).attr('id', 'selectedNode');
      this.state.selectedElement = n;
      // this.setState({
      //   selectedElement: n
      // })
    }
  };

  editNode = (n) => {
    // 编辑节点
    this.removeSelectedNode();
    n.setAttribute('id', 'editing');
    d3.select(n)
      .selectAll('foreignObject')
      .filter((a, b, c) => c[b].parentNode === n)
      .select('div')
      .attr('contenteditable', true);

    const fdiv = document.querySelector('#editing > foreignObject > div');
    window.getSelection().selectAllChildren(fdiv);
  };

  editNew = (newJSON, depth, pNode) => {
    // 聚焦新节点
    d3.transition()
      .end()
      .then(
        () => {
          const clickedNode = d3
            .select(pNode)
            .selectAll(`g.node.depth_${depth}`)
            .filter((b) => b.data === newJSON)
            .node();

          this.editNode(clickedNode);
        },
        (err) => {
          console.log(err);
        }
      );
  };

  fdivMouseDown = () => {
    const flag = d3.event.target.getAttribute('contenteditable');
    if (flag === 'true') {
      d3.event.stopPropagation(); // 防止触发drag、click
    }
  };

  fObjectClick = (d, i, n) => {
    const edit = document.getElementById('editing');
    const sele = document.getElementById('selectedNode');
    const clickedNode = n[i].parentNode;

    if (!edit) {
      // 未在编辑
      this.selectNode(clickedNode);

      const fdiv = d3
        .select(clickedNode)
        .selectAll('foreignObject')
        .filter((a, b, c) => c[b].parentNode === clickedNode)
        .select('div')
        .node();
      fdiv.contentEditable = true;

      new Promise((resolve) => {
        setTimeout(() => {
          let flag = false; // 单击false 双击true
          if (document.activeElement !== fdiv) {
            fdiv.contentEditable = false;
          } else {
            flag = true;
            this.removeSelectedNode();
            clickedNode.setAttribute('id', 'editing');
          }
          resolve(flag);
        }, 150);
      }).then((flag) => {
        if (!flag && clickedNode.isSameNode(sele)) {
          // 进入编辑状态
          this.editNode(clickedNode);
        }
      });
    }
  };

  fObjectRightClick = (d, i, n) => {
    const sele = document.getElementById('selectedNode');
    const edit = document.getElementById('editing');
    const clickedNode = n[i].parentNode;
    if (clickedNode.isSameNode(edit)) {
      // 正在编辑
      return;
    }
    if (!clickedNode.isSameNode(sele)) {
      // 选中
      this.selectNode(clickedNode);
    }
    // 显示右键菜单
    const svgPosition = this.state.mindmap_svg.node().getBoundingClientRect();
    this.setState({
      contextMenuX: d3.event.pageX - svgPosition.x - window.scrollX,
      contextMenuY: d3.event.pageY - svgPosition.y - window.scrollY,
      showContextMenu: true,
    });

    this.clearSelection();
    setTimeout(() => {
      this.menuRef.current.focus();
    }, 300);
  };

  gBtnClick = (a, i, n) => {
    // 添加子节点
    if (n[i].style.opacity === '1') {
      const newJSON = {
        name: '新建节点',
        children: [],
      };

      const d = d3.select(n[i].parentNode).data()[0];
      this.add(d.data, newJSON);
      this.mouseLeave(null, i, n);
      this.editNew(newJSON, d.depth + 1, n[i].parentNode);
    }
  };

  clickMenu = (item) => {
    this.setState({
      showContextMenu: false,
    });
    this.removeSelectedNode();
    if (item.command === 0) {
      // 删除节点
      this.del(this.state.selectedElement.__data__.data);
    }
  };

  // 悬浮事件
  mouseLeave = (d, i, n) => {
    if (n[i].className.baseVal.includes('gButton')) {
      d3.select(n[i]).style('opacity', 0);
    } else {
      d3.selectAll('g.gButton')
        .filter((a, b, c) => c[b].parentNode === n[i].parentNode)
        .style('opacity', 0);
    }
  };

  mouseEnter = (d, i, n) => {
    if (this.props.depthLimit) {
      if (d.depth < this.props.depthLimit) {
        if (n[i].className.baseVal.includes('gButton')) {
          d3.select(n[i]).style('opacity', 1);
        } else {
          d3.selectAll('g.gButton')
            .filter((a, b, c) => c[b].parentNode === n[i].parentNode)
            .style('opacity', 0.5);
        }
      }
    } else {
      if (n[i].className.baseVal.includes('gButton')) {
        d3.select(n[i]).style('opacity', 1);
      } else {
        d3.selectAll('g.gButton')
          .filter((a, b, c) => c[b].parentNode === n[i].parentNode)
          .style('opacity', 0.5);
      }
    }
  };

  // 拖拽
  draggedNodeRenew = (draggedNode, targetX, targetY, dura = 0) => {
    const { link } = this.state;
    const { xSpacing } = this.props;
    const tran = d3.transition().duration(dura).ease(d3.easePoly);
    d3.select(draggedNode)
      .transition(tran)
      .attr('transform', `translate(${targetY},${targetX})`);
    // 更新draggedNode与父节点的path
    d3.select(draggedNode).each((d) => {
      d3.select(`path#path_${d.data.nodeId}`)
        .transition(tran)
        .attr(
          'd',
          `${link({
            source: [
              -targetY + (d.parent ? d.parent.data.size[1] : 0) - xSpacing,
              -targetX + (d.parent ? d.parent.data.size[0] / 2 : 0),
            ],
            target: [0, d.data.size[0] / 2],
          })}L${d.data.size[1] - xSpacing},${d.data.size[0] / 2}`
        );
    });
  };

  draggedNodeChildrenRenew = (d, px, py) => {
    const { draggedNodeChildrenRenew } = this;
    d.px = px;
    d.py = py;
    if (d.children) {
      for (let index = 0; index < d.children.length; index += 1) {
        const dChild = d.children[index];
        draggedNodeChildrenRenew(dChild, px, py);
      }
    }
  };

  dragged = (a, i, n) => {
    // 拖拽中【待完善】
    const { xSpacing } = this.props;
    const { mindmap_g } = this.state;
    const { draggedNodeChildrenRenew, draggedNodeRenew } = this;
    const draggedNode = n[i].parentNode;
    const fObject = n[i];
    // 选中
    const sele = document.getElementById('selectedNode');
    if (sele && !sele.isSameNode(draggedNode)) {
      sele.removeAttribute('id');
    }
    // 拖拽
    // 相对a原本位置的偏移
    const py = d3.event.x - a.x; // x轴偏移的量
    const px = d3.event.y - a.y; // y轴偏移的量
    draggedNodeChildrenRenew(a, px, py);
    // 相对a.parent位置的坐标
    let targetY = a.dy + py; // x轴坐标
    let targetX = a.dx + px; // y轴坐标
    draggedNodeRenew(draggedNode, targetX, targetY);
    // foreignObject偏移
    targetY += parseInt(fObject.getAttribute('x'), 10);
    targetX += parseInt(fObject.getAttribute('y'), 10);

    // 计算others相对a.parent位置的坐标
    mindmap_g
      .selectAll('g.node')
      .filter(
        (d, i, n) =>
          !draggedNode.isSameNode(n[i]) &&
          !draggedNode.parentNode.isSameNode(n[i])
      )
      .each((d, i, n) => {
        const gNode = n[i];
        const gRect = gNode.getElementsByTagName('foreignObject')[0];
        const rect = {
          // 其他gRect相对a.parent的坐标，以及gRect的宽高
          y:
            parseInt(gRect.getAttribute('x'), 10) + // foreignObject的x轴偏移
            d.y +
            (d.py ? d.py : 0) -
            (a.parent ? a.parent.y : 0),
          x:
            parseInt(gRect.getAttribute('y'), 10) + // foreignObject的y轴偏移
            d.x +
            (d.px ? d.px : 0) -
            (a.parent ? a.parent.x : 0),
          width: d.size[1] - xSpacing,
          height: d.size[0],
        };
        // 重叠触发矩形边框
        if (
          targetY > rect.y &&
          targetY < rect.y + rect.width &&
          targetX > rect.x &&
          targetX < rect.x + rect.height
        ) {
          if (d.depth < this.props.depthLimit) {
            gNode.setAttribute('id', 'newParentNode');
          }
        } else if (gNode.getAttribute('id') === 'newParentNode') {
          gNode.removeAttribute('id');
        }
      });
  };

  dragback = (subject, draggedNode) => {
    const { draggedNodeChildrenRenew, draggedNodeRenew } = this;
    draggedNodeChildrenRenew(subject, 0, 0);
    draggedNodeRenew(draggedNode, subject.dx, subject.dy, 1000);
  };

  dragended = (d, i, n) => {
    const { root } = this.state;
    const { dragback } = this;
    const { subject } = d3.event;
    const draggedNode = n[i].parentNode;
    let draggedParentNode = draggedNode.parentNode;
    if (draggedParentNode.isEqualNode(this.contentRef.current)) {
      // 拖拽的是根节点时复原
      dragback(subject, draggedNode);
      return;
    }
    const newParentNode = document.getElementById('newParentNode');
    if (newParentNode) {
      // 建立新的父子关系
      newParentNode.removeAttribute('id');

      d3.select(draggedNode).each((draggedD) => {
        d3.select(newParentNode).each((newParentD) => {
          // 处理数据
          draggedNode.remove();
          this.del(draggedD.data);
        });
      });
      d3.select(draggedNode).each((draggedD) => {
        d3.select(newParentNode).each((newParentD) => {
          this.add(newParentD.data, draggedD.data);
        });
      });
      return;
    }
    if (Math.abs(subject.px) < root.nodeHeight) {
      // 平移距离不足以调换兄弟节点顺序时复原
      dragback(subject, draggedNode);
      return;
    }
    // 调换兄弟节点顺序
    draggedParentNode = d3.select(draggedParentNode);
    draggedParentNode.each((d) => {
      const draggedBrotherNodes = draggedParentNode
        .selectAll(`g.depth_${d.depth + 1}`)
        .filter((a, i, n) => !draggedNode.isSameNode(n[i]));
      if (!draggedBrotherNodes.nodes()[0]) {
        // 无兄弟节点时复原
        dragback(subject, draggedNode);
        return;
      }
      const a = { x0: Infinity, x1: -Infinity };
      draggedBrotherNodes.each((b, i, n) => {
        if (b.x > subject.x && b.x > a.x1 && b.x < subject.x + subject.px) {
          // 新哥哥节点
          a.x1 = b.x;
          a.b1 = b.data;
          a.n1 = n[i];
        }
        if (b.x < subject.x && b.x < a.x0 && b.x > subject.x + subject.px) {
          // 新弟弟节点
          a.x0 = b.x;
          a.b0 = b.data;
          a.n0 = n[i];
        }
      });
      if (a.b0 || a.b1) {
        // 存在新兄弟节点时调换节点顺序
        this.del(subject.data);
        if (a.b0) {
          // 插入在兄弟节点前面
          this.insert(a.b0, subject.data);
          if (draggedNode.parentNode) {
            draggedNode.parentNode.insertBefore(draggedNode, a.n0);
          }
        } else if (a.b1) {
          // 插入在兄弟节点后面
          this.insert(a.b1, subject.data, 1);
          if (draggedNode.parentNode) {
            draggedNode.parentNode.insertBefore(draggedNode, a.n1.nextSibling);
          }
        }
      } else {
        dragback(subject, draggedNode);
      }
    });
  };

  // 绘制
  updateMindmap = () => {
    this.tree();
    this.getDTop();
    this.draw();
    this.initNodeEvent();
  };

  gClass = (d) => {
    return `depth_${d.depth} node`;
  };

  gTransform = (d) => {
    return `translate(${d.dy},${d.dx})`;
  };

  foreignY = (d) => {
    return -d.data.size[0] / 2 - 5;
  };

  gBtnTransform = (d) => {
    return `translate(${d.data.size[1] + 8 - this.props.xSpacing},${
      d.data.size[0] / 2 - 12
    })`;
  };

  pathId = (d) => {
    return `path_${d.data.nodeId}`;
  };

  pathClass = (d) => {
    return `depth_${d.depth}`;
  };

  pathColor = (d) => {
    return d.data.color;
  };

  path = (d) => {
    return `${this.state.link({
      source: [
        (d.parent ? d.parent.y + d.parent.data.size[1] : 0) -
          d.y -
          this.props.xSpacing, // 横坐标
        (d.parent ? d.parent.x + d.parent.data.size[0] / 2 : 0) - d.x, // 纵坐标
      ],
      target: [0, d.data.size[0] / 2],
    })}L${d.data.size[1] - this.props.xSpacing},${d.data.size[0] / 2}`;
  };

  nest = (d, i, n) => {
    const dd = d.children;
    if (dd) {
      d3.select(n[i])
        .selectAll(`g${dd[0] ? `.depth_${dd[0].depth}.node` : ''}`)
        .data(dd)
        .join(
          (enter) => this.appendNode(enter),
          (update) => this.updateNode(update),
          (exit) => this.exitNode(exit)
        );
    }
  };

  appendNode = (enter) => {
    const {
      gClass,
      gTransform,
      updateNodeName,
      divKeyDown,
      foreignY,
      gBtnTransform,
      pathId,
      pathClass,
      pathColor,
      path,
      nest,
      fdivMouseDown,
    } = this;

    const gNode = enter.append('g');
    gNode.attr('class', gClass).attr('transform', gTransform);

    const foreign = gNode
      .append('foreignObject')
      .attr('x', -5)
      .attr('y', foreignY);
    const foreignDiv = foreign
      .append('xhtml:div')
      .attr('contenteditable', false)
      .text((d) => d.data.name);
    foreignDiv
      .on('blur', updateNodeName)
      .on('keydown', divKeyDown)
      .on('mousedown', fdivMouseDown);
    foreignDiv.each((d, i, n) => {
      // eslint-disable-next-line no-undef
      const observer = new ResizeObserver((l) => {
        const t = l[0].target;
        const b1 = window.getComputedStyle(t).borderTopWidth;
        const b2 = window.getComputedStyle(t.parentNode).borderTopWidth;
        let spacing = parseInt(b1, 10) + parseInt(b2, 10);
        spacing = spacing || 0;
        foreign
          .filter((d, index) => i === index)
          .attr('width', l[0].contentRect.width + spacing * 2) // div和foreign border
          .attr('height', l[0].contentRect.height + spacing * 2);
      });
      observer.observe(n[i]);
    });

    const gBtn = gNode
      .append('g')
      .attr('class', 'gButton')
      .attr('transform', gBtnTransform);
    gBtn
      .append('rect')
      .attr('width', 24)
      .attr('height', 24)
      .attr('rx', 3)
      .attr('ry', 3);
    gBtn.append('path').attr('d', 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z');

    const enterData = enter.data();
    if (enterData.length) {
      if (enterData[0].data.nodeId !== '0') {
        gNode
          .append('path')
          .attr('id', pathId)
          .attr('class', pathClass)
          .lower()
          .attr('stroke', pathColor)
          .attr('d', path);
      } else if (enterData[0].data.nodeId === '0') {
        // 根节点
        foreign.attr('y', (d) => foreignY(d) + d.size[0] / 2);
      }

      gNode.each(nest);
    }

    gBtn.raise();
    foreign.raise();
    return gNode;
  };

  updateNode = (update) => {
    const {
      gClass,
      gTransform,
      foreignY,
      gBtnTransform,
      pathId,
      pathClass,
      pathColor,
      path,
      nest,
    } = this;
    const { easePolyInOut } = this.state;
    update.interrupt().selectAll('*').interrupt();
    update
      .attr('class', gClass)
      .transition(easePolyInOut)
      .attr('transform', gTransform);

    update.each((d, i, n) => {
      const node = d3.select(n[i]);
      const foreign = node
        .selectAll('foreignObject')
        .filter((d, i, n) => n[i].parentNode === node.node())
        .data((d) => [d]) // must rebind the children using selection.data to give them the new data.
        .attr(
          'y',
          d.data.nodeId !== '0' ? foreignY(d) : foreignY(d) + d.size[0] / 2
        );

      foreign.select('div').text(d.data.name);
      node
        .select('path')
        .filter((d, i, n) => n[i].parentNode === node.node())
        .attr('id', pathId(d))
        .attr('class', pathClass(d))
        .attr('stroke', pathColor(d))
        .transition(easePolyInOut)
        .attr('d', path(d));

      node.each(nest);

      node
        .selectAll('g.gButton')
        .filter((d, i, n) => n[i].parentNode === node.node())
        .attr('transform', gBtnTransform(d))
        .raise();
    });
    return update;
  };

  exitNode = (exit) => {
    exit.filter((d, i, n) => n[i].classList[0] !== 'gButton').remove();
  };

  draw = () => {
    // 生成svg
    const { mindmap_g } = this.state;
    const { appendNode, updateNode, exitNode } = this;
    const d = [this.state.root];

    mindmap_g
      .selectAll(`g${d[0] ? `.depth_${d[0].depth}.node` : ''}`)
      .data(d)
      .join(
        (enter) => appendNode(enter),
        (update) => updateNode(update),
        (exit) => exitNode(exit)
      );
  };

  tree = () => {
    // 数据处理
    const { mmdata } = this.state;
    const { ySpacing } = this.props;

    const layout = flextree({ spacing: ySpacing });

    const t = layout.hierarchy(mmdata.data[0]);

    layout(t);

    t.each((a) => {
      // x纵轴 y横轴
      // 相对偏移
      a.dx = a.x - (a.parent ? a.parent.x : 0);
      a.dy = a.y - (a.parent ? a.parent.y : 0);

      if (!a.children) {
        a.children = [];
      }
    });
    this.state.root = t;
    this.forceUpdate();
  };

  getDTop = () => {
    let t = this.state.root;

    while (t.children[0]) {
      t = t.children[0];
    }
    this.state.dTop = t;
    this.forceUpdate();
  };

  getTextSize = (t) => {
    const { dummy } = this.state;
    const { xSpacing } = this.props;
    let textWidth = 0;
    let textHeight = 0;
    dummy
      .selectAll('.dummyText')
      .data([t.name])
      .enter()
      .append('div')
      .text((d) => d)
      .each((d, i, n) => {
        textWidth = n[i].offsetWidth;
        textHeight = n[i].offsetHeight;
        n[i].remove(); // remove them just after displaying them
      });
    t.size = [textHeight, textWidth + xSpacing];
  };

  clearSelection = () => {
    // 清除右键触发的选中单词
    if (document.selection && document.selection.empty) {
      document.selection.empty();
    } else if (window.getSelection) {
      const sel = window.getSelection();
      sel.removeAllRanges();
    }
  };

  depthTraverse2 = (d, func) => {
    // 深度遍历，func每个元素
    for (let index = 0; index < d.length; index++) {
      const dChild = d[index];
      func(dChild);
      if (dChild.children) {
        this.depthTraverse2(dChild.children, func);
      }
    }
  };

  render() {
    const mmStyle = {
      width: this.props.width ? `${this.props.width}px` : '100%',
      height: this.props.height ? `${this.props.height}px` : '100vh',
    };

    const svgClass = `stroke-width-${this.props.strokeWidth}`;

    return (
      <div ref={this.mindmapRef} id="mindmap" style={mmStyle}>
        <svg ref={this.svgRef} className={svgClass} tabIndex="0">
          <g ref={this.contentRef} id="content" />
        </svg>
        <div ref={this.dummyRef} id="dummy" />
        {this.state.showContextMenu && (
          <div
            ref={this.menuRef}
            id="menu"
            tabIndex="0"
            style={{
              top: this.state.contextMenuY + 'px',
              left: this.state.contextMenuX + 'px',
            }}
            onBlur={() => {
              this.setState({
                showContextMenu: false,
              });
            }}
          >
            {this.state.contextMenuItems.map((item, index) => (
              <div
                className="menu-item"
                key={index}
                onClick={() => {
                  this.clickMenu(item);
                }}
              >
                {item.title}
              </div>
            ))}
          </div>
        )}

        <div className="button right-bottom">
          {this.props.gps && (
            <button
              className="icon"
              ref={this.gpsRef}
              type="button"
              onClick={this.makeCenter}
            >
              <i className="gps" />
            </button>
          )}
          {this.props.fitView && (
            <button
              className="icon"
              ref={this.fitViewRef}
              type="button"
              onClick={this.fitContent}
            >
              <i className="fitView" />
            </button>
          )}
          {this.props.download && (
            <button
              className="icon"
              ref={this.downloadRef}
              type="button"
              onClick={this.exportImage}
            >
              <i className="download" />
            </button>
          )}
        </div>
        <div className="button top-right">
          {this.props.showUndo && (
            <button
              className="icon"
              ref={this.undoRef}
              type="button"
              disabled={!this.canUndo()}
              onClick={this.canUndo() ? this.undo : null}
            >
              <i className="undo" />
            </button>
          )}
          {this.props.showUndo && (
            <button
              className="icon"
              ref={this.redoRef}
              type="button"
              disabled={!this.canRedo()}
              onClick={this.canRedo() ? this.redo : null}
            >
              <i className="redo" />
            </button>
          )}
        </div>
      </div>
    );
  }
}

MindMap.propTypes = {
  // value: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number,
  xSpacing: PropTypes.number,
  ySpacing: PropTypes.number,
  strokeWidth: PropTypes.number,
  draggable: PropTypes.bool,
  gps: PropTypes.bool,
  fitView: PropTypes.bool,
  download: PropTypes.bool,
  keyboard: PropTypes.bool,
  showNodeAdd: PropTypes.bool,
  contextMenu: PropTypes.bool,
  nodeClick: PropTypes.bool,
  zoomable: PropTypes.bool,
  showUndo: PropTypes.bool,
};

MindMap.defaultProps = {
  xSpacing: 80,
  ySpacing: 20,
  strokeWidth: 4,
  draggable: true,
  gps: true,
  fitView: false,
  download: false,
  keyboard: true,
  showNodeAdd: true,
  contextMenu: true,
  nodeClick: true,
  zoomable: true,
  showUndo: true,
};

export default MindMap;
