import React from 'react'

import MindNode from 'react-nodemap'
import sample from "./sample.json";

import 'react-nodemap/dist/index.css'

const App = () => {
  return <MindNode value={sample} />
}

export default App
