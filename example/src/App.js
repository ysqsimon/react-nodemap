import React, {Component, useState, useEffect} from 'react'

import MindNode from 'react-nodemap'
import sample from "./sample.json";

import 'react-nodemap/dist/index.css'

const App = () => {
  const [data, setData] = useState(sample)

  return (
    <div>
      <MindNode value={data} onDataChange={(value) => setData(value)}/>
    </div>
  )
}

export default App
