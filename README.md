# React-nodemap

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/react-nodemap.svg)](https://www.npmjs.com/package/react-nodemap) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

**react-nodemap**(I prefer to call it **react-mindmap**, but it is massively used 😰) is a mindmap React component that I converted from Vue by hand,so you may expect some bugs in any stage from packaging to excution. Feel free to post any issue you find, I will try my best to take care of it.
>the original Vue version: [https://github.com/hellowuxin/mindmap]

## 🉐🈚 Demo
play with the [Demo](https://ysqsimon.github.io/react-nodemap/)

## 🤟🏻New Updates
1. added right click context menu and an option to
2. export whole mindmap to img or pdf

## 💾 Install

```bash
npm install react-nodemap
```
or
```bash
yarn add react-nodemap
```

## 🔌 API
| Property      | Description   | Type  | Default |
| ------------- |:-------------:| -----:| -------:|
| defaultValue  | tree data(currently only accepts one obj in the array as the only root ) | `[]` | `[{ name: 'Root', children: [] }]` |
| value         | same as `defaultValue`, but has full control  | `[]` | `[{ name: 'Root', children: [] }]` |
| depthLimit    | add limit to tree depth  | int | null |
| fields | specify the extra fields you pass into the data structure and also expecting them back when exported in onDataChange, by default see below node structure | `[]` | `['id','createdAt']`|
| onDataChange  | function to update your data passed in `value` prop   |  func | |
| style | good to specify whole canvas width and height, especially for export to pdf, the best is a 297:210 ratio landscape | `{}` | none |

#### ❗ Note
Node Data Structure Export
```jsx
{
  name:'',
  children:[],
  // generated in the tree constructor, will be replaced if you have your own fields array
  size:[], 
  color:'',
  depth: 0,
  nodeId: 0,
}
``` 
- `onDataChange` will only fire when you add, delete, move branch, change sibling positions and change text of nodes(when a node input loses focus)
- specify the fields in `fields` as an array like `['id','createdAt']` to keep data clean when exporting, but 👇
```diff
! WARNING: avoid passing in fields with already taken names, see above node structure
```

## 🍻 Example
you can play around with the component `<Nodemap />` even before adding any props, but be sure to add `onDataChange` func to update the var you passed into the value prop
### React Class Component
```jsx
import React, { Component } from 'react'

import Nodemap from 'react-nodemap'
import 'react-nodemap/dist/index.css'

class Example extends Component {
  constructor(props){
    super(props)
    this.state = {
      data: [
        {
          name: 'some text',
          children:[ 
            {
              name: 'some other text',
              children:[]
            }
          ]
        }
      ]
    }
  }

  onDataChange = (value) =>{
    this.setState({
      data: value
    })
  }

  render() {
    return 
    <Nodemap 
      defaultValue={this.state.data} 
      onDataChange={this.onDataChange}
      depthLimit={4}
      fields={['id','createdAt']}// output fields will be ['name', 'children','id','createdAt'], others will be omitted
    />
  }
}
```
or
### React Hooks Component

```jsx
import React, {useState, useEffect} from 'react'
import Nodemap from 'react-nodemap'

import 'react-nodemap/dist/index.css'

const App = () => {
  const [data,setData] = useState([
    {
      name: 'some text',
      children:[ 
        {
          name: 'some other text',
          children:[]
        }
      ]
    }
  ])

  return (
    <div>
      <Nodemap 
        value={data} 
        onDataChange={(value) => setData(value)}
        depthLimit={0}
        fields={['color','depth','id']}
      />
    </div>
  )
}
```

### 😵 Known bugs（that currently no idea how to fix）
- [ ] change siblings position downward sometimes will not work or maybe crash

## License

MIT © [ysqsimon](https://github.com/ysqsimon)
