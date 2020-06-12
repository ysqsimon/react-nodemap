# React-nodemap

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/react-nodemap.svg)](https://www.npmjs.com/package/react-nodemap) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

**react-nodemap** is a mindmap component that I roughly converted from Vue to React(I prefer to call it **react-mindmap**, but it is massively used :/)
>the original Vue version: [https://github.com/hellowuxin/mindmap]
so you may expect some bugs in any stage

## Online Demo
play with the [Demo](https://ysqsimon.github.io/react-nodemap/)

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
| onChange      | function to update your component state passed in `value` prop   |   func | |

## Example
you can play around with the component `<Nodemap />` even before adding any props, but be sure to add `onChange` func to update the var you passed into the value prop
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
      <Nodemap value={data} onChange={(value) => setData(value)}/>
    </div>
  )
}
```

### Known bugs
1. change siblings position sometimes will not work even crash

## License

MIT © [ysqsimon](https://github.com/ysqsimon)
