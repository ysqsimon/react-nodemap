import React, { Component } from 'react';
import PropTypes from 'prop-types';

import JSONData from './js/JSONData';
import * as d3 from './js/d3';
import Mindmap from './components/MindMap';
import './index.scss';

class MindNode extends Component {
  constructor(props) {
    super(props);
    this.state = {
      outline_svg: {},
      mindnode_data: null,
      selectedNode: null,
      hotkey_g: {},
    };
  }

  componentDidMount() {
    if (this.props.value || this.props.defaultValue) {
      this.state.mindnode_data = new JSONData(
        this.props.value || this.props.defaultValue
      );
    } else {
      this.state.mindnode_data = new JSONData([{ name: 'Root', children: [] }]);
    }

    this.state.hotkey_g = d3.select('g#hotkey');

    this.drawHotkey();
    this.init();
    this.forceUpdate();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.value !== this.props.value) {
      this.state.mindnode_data = new JSONData(this.props.value);
    }
  }

  init = () => {
    const { listenKeyDown } = this;

    document.addEventListener('keydown', listenKeyDown);
  };

  listenKeyDown = (event) => {
    const { mindnode_data } = this.state;
    const sele = d3.select('#selectedMindnode');
    if (!sele.nodes()[0]) {
      return;
    }
    const newJSON = { name: '新建节点', children: [] };
    const keyName = event.key;
    if (keyName === 'Tab') {
      // 添加子节点
      event.preventDefault();
      sele.each((d) => {
        mindnode_data.add(d.data, newJSON);
      });
    } else if (keyName === 'Enter') {
      // 添加弟弟节点
      event.preventDefault();
      sele.each((d, i, n) => {
        const mindmap_g = d3.select('g#mindmapRoot');
        if (n[i].parentNode.isSameNode(mindmap_g.nodes()[0])) {
          // 根节点enter时，等效tab
          mindnode_data.add(d.data, newJSON);
        } else {
          mindnode_data.insert(d.data, newJSON, 1);
        }
      });
    } else if (keyName === 'Backspace') {
      // 删除节点
      event.preventDefault();
      sele.each((d) => {
        mindnode_data.del(d.data);
      });
    }
  };

  drawHotkey = () => {
    const { hotkey_g } = this.state;
    hotkey_g
      .append('text')
      .text('选中状态下：')
      .attr('transform', 'translate(0, 20)');
    hotkey_g
      .append('text')
      .text('Tab添加子节点')
      .attr('transform', 'translate(20, 40)');
    hotkey_g
      .append('text')
      .text('Enter添加弟弟节点')
      .attr('transform', 'translate(20, 60)');
    hotkey_g
      .append('text')
      .text('Backspace/delete删除节点')
      .attr('transform', 'translate(20, 80)');
    hotkey_g
      .append('text')
      .text('单击编辑节点')
      .attr('transform', 'translate(20, 100)');
  };

  getSelectedNode = (d) => {
    this.state.selectedNode = d;
  };

  change = (value) => {
    if (this.props.onDataChange) {
      this.props.onDataChange(value);
    }
  };

  render() {
    const treeData = this.props.value
      ? new JSONData(this.props.value)
      : new JSONData([{ name: 'Root', children: [] }]);
    return (
      <div className="wrapper">
        <Mindmap
          value={treeData}
          change={this.change}
          depthLimit={this.props.depthLimit}
          fields={this.props.fields}
        />
      </div>
    );
  }
}

MindNode.propTypes = {
  // props
  value: PropTypes.array,
  depthLimit: PropTypes.number,
  fields: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  // func
  onDataChange: PropTypes.func,
};

export default MindNode;
