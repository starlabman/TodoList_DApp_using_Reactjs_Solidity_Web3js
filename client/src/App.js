import React, { useState, useEffect, useCallback } from 'react';
import { Container, Box, Typography, TextField, Button, AppBar, Toolbar, IconButton } from '@mui/material';
import TaskTable from './Task';
import MenuIcon from '@mui/icons-material/Menu';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TaskContractAddress } from './config.js';
import Web3 from 'web3';
import TaskAbi from './utils/TaskContract.json';

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [correctNetwork, setCorrectNetwork] = useState(false);

  const getAllTasks = useCallback(async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const web3 = new Web3(ethereum);
        const TaskContract = new web3.eth.Contract(TaskAbi.abi, TaskContractAddress);
        const allTasks = await TaskContract.methods.getMyTasks().call({ from: currentAccount });

        const tasks = allTasks.map(task => ({
          id: task.id.toString(),
          taskText: task.taskText,
          wallet: task.wallet,
          taskDate: new Date(task.taskDate * 1000).toLocaleDateString(),
          taskTime: new Date(task.taskDate * 1000).toLocaleTimeString(),
          isDeleted: task.isDeleted
        }));

        setTasks(tasks);
      } else {
        toast.error("Ethereum object doesn't exist");
      }
    } catch (error) {
      toast.error("Failed to fetch tasks");
    }
  }, [currentAccount]);

  useEffect(() => {
    if (currentAccount) {
      getAllTasks();
    }
  }, [currentAccount, getAllTasks]);

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
      id: tasks.length + 1,
      taskText: input,
      isDeleted: false
    };

    try {
      const { ethereum } = window;

      if (ethereum) {
        const web3 = new Web3(ethereum);
        const TaskContract = new web3.eth.Contract(TaskAbi.abi, TaskContractAddress);

        await TaskContract.methods.addTask(task.taskText, task.isDeleted).send({ from: currentAccount });
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
        const web3 = new Web3(ethereum);
        const TaskContract = new web3.eth.Contract(TaskAbi.abi, TaskContractAddress);

        await TaskContract.methods.deleteTask(taskId, true).send({ from: currentAccount });
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        setTasks(updatedTasks);
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
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
          TodoList Dapp
          </Typography>
          {currentAccount === '' ? (
            <Button color="inherit" onClick={connectWallet}>Connect Wallet</Button>
          ) : (
            <Typography variant="h6">{currentAccount}</Typography>
          )}
        </Toolbar>
      </AppBar>
      <Container>
        {currentAccount === '' ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
            <Button variant="contained" color="primary" size="large" onClick={connectWallet}>
              Connect Wallet
            </Button>
          </Box>
        ) : correctNetwork ? (
          <Box mt={4}>
            <Typography variant="h4" align="center" gutterBottom>TodoList Dapp</Typography>
            <Box component="form" onSubmit={addTask} display="flex" justifyContent="center" mb={2}>
              <TextField 
                id="outlined-basic" 
                label="New Task" 
                variant="outlined" 
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ marginRight: 8 }}
              />
              <Button variant="contained" color="primary" type="submit">Add Task</Button>
            </Box>
            <TaskTable tasks={tasks} onDelete={deleteTask} />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
            <Typography variant="h6" color="error">Please connect to the Sepolia Testnet</Typography>
            <Typography variant="subtitle1">and reload the page</Typography>
          </Box>
        )}
      </Container>
    </div>
  );
}

export default App;
