import React, {Component, useState, useEffect} from 'react'

import MindNode from 'react-nodemap'
import sample from "./sample.json";

import 'react-nodemap/dist/index.css'

const App = () => {
  const [name,setName] = useState('课程名')
  const [data, setData] = useState(sample)

  return (
    <div>
      <MindNode value={data} onChange={(value) =>  setData(value)}/>
    </div>
  )
}

export default App
