import React from "react";
import { useState, useEffect } from "react";
// import Data from "./Data";

function Register2() {

  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const storedTodos = localStorage.getItem('todos');
    if (storedTodos) {
      setTodos(JSON.parse(storedTodos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleAddTodo = () => {
    if (inputValue.trim() !== '') {
      setTodos([...todos, inputValue]);
      setInputValue('');
    }
  };

  const handleDeleteTodo = (index) => {
    const updatedTodos = todos.filter((_, i) => i !== index);
    setTodos(updatedTodos);
  };

  return (
    <div className="container">
      <div className="title-box">
        <h1 style={{ fontFamily: '"SBB Web Roman"', color: 'white' }}>
          <span style={{ fontWeight: 'bold' }}>GTFS</span> <span style={{ fontSize: '0.8em' }}>Service-Alerts</span>
        </h1>
      </div>
      <div className="main-box">
        <div className='title'>
          <h3 style={{ fontFamily: "SBB Web Roman" }}>Dunkelmodus</h3>
        </div>
        <div className='main' style={{ justifyContent: 'center', textAlign: 'center' }}>
          {/* <Data/> */}
          <div style={{ fontFamily: "SBB Web Roman" }}>
            <h1>Weiterentwicklung | Tuduus</h1>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Enter your task"
              style={{ padding: '5px', fontSize: 'large' }}
            />
            <button onClick={handleAddTodo} style={{ marginLeft: '10px', border: 'none', backgroundColor: 'red', color: 'white', padding: '5px', fontSize: 'large' }}>Add</button>
            <ul style={{ listStyle: 'none', marginTop: '25px' }}>
              {todos.map((todo, index) => (
                <li key={index} style={{ marginBottom: '5px', fontWeight: 'bold' }}>
                  {todo}
                  <button onClick={() => handleDeleteTodo(index)} style={{ marginLeft: '10px', border: 'none', backgroundColor: 'red', color: 'white', padding: '5px' }}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <p style={{ position: 'absolute', bottom: -5, right: 10, fontFamily: "SBB Web Roman", fontSize: 'small' }}>Autor: Benjamin Guggisberg (Bachelor-Thesis)</p>
    </div>
  );
}


export default Register2;