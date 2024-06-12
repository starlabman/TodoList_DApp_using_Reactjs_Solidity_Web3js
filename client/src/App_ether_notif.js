import React, { useState, useEffect } from 'react';
import { TextField, Button } from '@mui/material';
import TaskTable from './Task';
import './App.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { TaskContractAddress } from './config.js';
import { ethers } from 'ethers';
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
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const TaskContract = new ethers.Contract(
          TaskContractAddress,
          TaskAbi.abi,
          signer
        );

        let allTasks = await TaskContract.getMyTasks();
        allTasks = allTasks.map(task => ({
          id: task.id.toString(),
          taskText: task.taskText,
          wallet: task.wallet,
          taskDate: new Date(task.taskDate * 1000).toLocaleDateString(),
          taskTime: new Date(task.taskDate * 1000).toLocaleTimeString(),
          isDeleted: task.isDeleted
        }));
        setTasks(allTasks);
      } else {
        toast.error("Ethereum object doesn't exist");
      }
    } catch (error) {
      toast.error("Failed to fetch tasks");
    }
  };

  useEffect(() => {
    getAllTasks();
  }, []);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        toast.error('Metamask not detected');
        return;
      }
      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log('Connected to chain:' + chainId);

      const sepoliaChainId = '0xaa36a7';

      if (chainId !== sepoliaChainId) {
        toast.error('You are not connected to the Sepolia Testnet!');
        return;
      } else {
        setCorrectNetwork(true);
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      console.log('Found account', accounts[0]);
      setCurrentAccount(accounts[0]);
      toast.success('Wallet connected');
    } catch (error) {
      toast.error('Error connecting to metamask');
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
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const TaskContract = new ethers.Contract(
          TaskContractAddress,
          TaskAbi.abi,
          signer
        );

        await TaskContract.addTask(task.taskText, task.isDeleted);
        setTasks([...tasks, task]);
        toast.success("Task added successfully");
      } else {
        toast.error("Ethereum object doesn't exist!");
      }
    } catch (error) {
      toast.error("Error submitting new Task");
    }

    setInput('');
  };

  const deleteTask = async (taskId) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const TaskContract = new ethers.Contract(
          TaskContractAddress,
          TaskAbi.abi,
          signer
        );

        await TaskContract.deleteTask(taskId, true);
        let allTasks = await TaskContract.getMyTasks();
        allTasks = allTasks.map(task => ({
          id: task.id.toString(),
          taskText: task.taskText,
          isDeleted: task.isDeleted
        }));
        setTasks(allTasks);
        toast.success("Task deleted successfully");
      } else {
        toast.error("Ethereum object doesn't exist");
      }
    } catch (error) {
      toast.error("Error deleting task");
    }
  };

  return (
    <div>
      <ToastContainer />
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
