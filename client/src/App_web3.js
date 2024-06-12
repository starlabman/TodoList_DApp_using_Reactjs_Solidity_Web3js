import React, { useState, useEffect } from 'react';
import { TextField, Button } from '@mui/material';
import TaskTable from './Task.js';
import './App.css';

import { TaskContractAddress } from './config.js';
import Web3 from 'web3';
import TaskAbi from './utils/TaskContract.json';

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [correctNetwork, setCorrectNetwork] = useState(false);

  const getAllTasks = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const web3 = new Web3(ethereum);
        const TaskContract = new web3.eth.Contract(TaskAbi.abi, TaskContractAddress);

        let allTasks = await TaskContract.methods.getMyTasks().call();
        allTasks = allTasks.map(task => ({
          id: task.id.toString(),
          taskText: task.taskText,
          isDeleted: task.isDeleted
        }));
        setTasks(allTasks);
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllTasks();
  }, []);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('Metamask not detected');
        return;
      }
      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log('Connected to chain:' + chainId);

      const sepoliaChainId = '0xaa36a7';

      if (chainId !== sepoliaChainId) {
        alert('You are not connected to the Sepolia Testnet!');
        return;
      } else {
        setCorrectNetwork(true);
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      console.log('Found account', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log('Error connecting to metamask', error);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();

    const task = {
      'id': tasks.length + 1,
      'taskText': input,
      'isDeleted': false
    };

    try {
      const { ethereum } = window;

      if (ethereum) {
        const web3 = new Web3(ethereum);
        const TaskContract = new web3.eth.Contract(TaskAbi.abi, TaskContractAddress);

        await TaskContract.methods.addTask(task.taskText, task.isDeleted).send({ from: currentAccount });
        setTasks([...tasks, task]);
        console.log("Completed Task");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log("Error submitting new Task", error);
    }

    setInput('');
  };

  const deleteTask = async (taskId) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const web3 = new Web3(ethereum);
        const TaskContract = new web3.eth.Contract(TaskAbi.abi, TaskContractAddress);

        await TaskContract.methods.deleteTask(taskId, true).send({ from: currentAccount });
        let allTasks = await TaskContract.methods.getMyTasks().call();
        allTasks = allTasks.map(task => ({
          id: task.id.toString(),
          taskText: task.taskText,
          isDeleted: task.isDeleted
        }));
        setTasks(allTasks);
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      {currentAccount === '' ? (
        <Button
          variant="contained"
          color="primary"
          size="large"
          className="connect-wallet-button"
          onClick={connectWallet}
        >
          Connect Wallet
        </Button>
      ) : correctNetwork ? (
        <div className="App">
          <h2> Task Management App</h2>
          <form>
            <TextField id="outlined-basic" label="Make Todo" variant="outlined" style={{ margin: "0px 5px" }} size="small" value={input}
              onChange={e => setInput(e.target.value)} />
            <Button variant="contained" color="primary" onClick={addTask}>Add Task</Button>
          </form>
          <TaskTable tasks={tasks} onDelete={deleteTask} />
        </div>
      ) : (
        <div className='flex flex-col justify-center items-center mb-20 font-bold text-2xl gap-y-3'>
          <div>----------------------------------------</div>
          <div>Please connect to the Sepolia Testnet</div>
          <div>and reload the page</div>
          <div>----------------------------------------</div>
        </div>
      )}
    </div>
  );
}

export default App;
