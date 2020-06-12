# react-nodemap

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/react-nodemap.svg)](https://www.npmjs.com/package/react-nodemap) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Note
This is a mindmap component that I roughly converted from Vue to React,
>the original Vue version: (https://github.com/hellowuxin/mindmap)

## Install

```bash
npm install react-nodemap
```
or
```bash
yarn add react-nodemap
```

## Usage

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

  onChange = (value) =>{
    this.setState({
      data: value
    })
  }

  render() {
    return <Nodemap value={this.state.data} onChange={this.onChange}/>
  }
}
```
or
### React Hooks Component

```jsx
import React, {useState, useEffect} from 'react'
import MindNode from 'react-nodemap'

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
      <MindNode value={data} onChange={(value) => setData(value)}/>
    </div>
  )
}
```

## License

MIT © [ysqsimon](https://github.com/ysqsimon)
