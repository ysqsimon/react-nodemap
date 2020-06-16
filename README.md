# React-nodemap

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/react-nodemap.svg)](https://www.npmjs.com/package/react-nodemap) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

**react-nodemap**(I prefer to call it **react-mindmap**, but it is massively used :/) is a mindmap React component that I converted from Vue by hand,so you may expect some bugs in any stage from packaging to excution. Feel free to post any issue you find, I will try my best to take care of it.
>the original Vue version: [https://github.com/hellowuxin/mindmap]

## Online Demo
play with the [Demo](https://ysqsimon.github.io/react-nodemap/)

## New Feature
1.depthLimit: you can add a depth limit to the tree, which means you can restrict the addition or changing position of node to any position beyond the depthLimit specified.

## Install

```bash
npm install react-nodemap
```
or
```bash
yarn add react-nodemap
```

## API
| Property      | Description   | Type  | Default |
| ------------- |:-------------:| -----:| -------:|
| value         | tree data(currently only accepts one obj in the array as the only root )  | array | `[{ name: 'Root', children: [] }]` |
| depthLimit    | add limit to tree depth  | int | null |
| onDataChange  | function to update your data passed in `value` prop   |  func | |

#### Note
`onDataChange` will only fire when you add, delete, move branch, change sibling positions and change text of nodes(when a node input loses focus)

## Example
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
        depthLimit={4}
      />
    </div>
  )
}
```

### Known bugs
- [ ] change siblings position downward sometimes will not work or maybe crash

## License

MIT © [ysqsimon](https://github.com/ysqsimon)
