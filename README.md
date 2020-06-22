# React-nodemap

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/react-nodemap.svg)](https://www.npmjs.com/package/react-nodemap) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

**react-nodemap**(I prefer to call it **react-mindmap**, but it is massively used 😰) is a mindmap React component that I converted from Vue by hand,so you may expect some bugs in any stage from packaging to excution. Feel free to post any issue you find, I will try my best to take care of it.
>the original Vue version: [https://github.com/hellowuxin/mindmap]

## 🉐🈚 Demo
play with the [Demo](https://ysqsimon.github.io/react-nodemap/)

## 🤟🏻New Updates
1. fields: add your own data structure to the tree value and remain untouched when exported(useful when you get/save the tree from/into database).
2. depthLimit: you can add a depth limit to the tree, which means you can restrict the addition or changing position of node to any position beyond the depthLimit specified.

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
| value         | tree data(currently only accepts one obj in the array as the only root )  | array | `[{ name: 'Root', children: [] }]` |
| depthLimit    | add limit to tree depth  | int | null |
| fields | specify the extra fields you pass into the data structure and also expecting them back when exported in onDataChange, or only 'name' and 'children' fields will be kept | `[] || 'keepAll'` | `['name','children']`|
| onDataChange  | function to update your data passed in `value` prop   |  func | |

#### ❗ Note
Node Data Structure
```jsx
{
  name:'',
  children:[],

  // will be omitted when getting data by default, can be controled in `fields` prop
  size:[], 
  color:'',
  depth: 0,
  nodeId: 0,
}
``` 
- `onDataChange` will only fire when you add, delete, move branch, change sibling positions and change text of nodes(when a node input loses focus)
- specify any other fields you pass into the data structure in `fields` as an array like `['id','createdAt']` to keep data clean, or use 'keepAll'(yes, the string, not ['keepAll']) if you just want all of them , but 👇
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
      value={this.state.data} 
      onDataChange={this.onDataChange}
      depthLimit={4}
      fields={['id','createdAt']}
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
        fields="keepAll"
      />
    </div>
  )
}
```

### 😵 Known bugs（that currently no idea how to fix）
- [ ] change siblings position downward sometimes will not work or maybe crash

## License

MIT © [ysqsimon](https://github.com/ysqsimon)
