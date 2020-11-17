import React from 'react';
import { Menu, Item, Separator, Submenu, contextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.min.css';

export { contextMenu };

export default class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: [],
      contextMenuItems: [
        {
          title: '导出',
          command: '0',
          children: [
            { title: '图片', command: '01' },
            { title: 'PDF', command: '02' },
          ],
        },
      ],
    };
  }

  render() {
    return (
      <Menu id={this.props.id} animation="pop" theme="light">
        {this.state.contextMenuItems.map((item, index) => {
          if (item.children && item.children.length) {
            return (
              <Submenu label={item.title}>
                {item.children.map((el, ind) => (
                  <Item
                    key={ind}
                    onClick={() => {
                      if (item.command === '0') {
                        this.props.loading();
                        setTimeout(() => {
                          this.props.stopLoading();
                        }, 1000);
                      }
                      this.props.onClick(el);
                    }}
                  >
                    {el.title}
                  </Item>
                ))}
              </Submenu>
            );
          }
          return (
            <Item
              key={index}
              onClick={() => {
                this.props.onClick(item);
              }}
            >
              {item.title}
            </Item>
          );
        })}
      </Menu>
    );
  }
}
