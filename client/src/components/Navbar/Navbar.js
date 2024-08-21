import React,{useState,useEffect} from 'react'
import {AppBar,Avatar,Button,Toolbar,Typography} from "@material-ui/core"
import {Link,useHistory,useLocation} from "react-router-dom"
import {useDispatch} from "react-redux"
import memories from "../../images/memories.png"
import useStyles from "./styles"
const Navbar = () => {
    const classes = useStyles();
    const history = useHistory();
    const location = useLocation();
    const dispatch = useDispatch();
    const [user,setUser] = useState(JSON.parse(localStorage.getItem('profile')));
    
    const logout = () => {
        dispatch({type:"LOGOUT"})
        history.push("/")
        setUser(null);
    }
    useEffect(()=>{
     const token = user?.token;
     setUser(JSON.parse(localStorage.getItem('profile')));
    },[location])

    return (
        <AppBar className={classes.appBar} position="static" color="inherit">
            <div>
                <Typography component={Link} to="/" className={classes.heading} variant="h3" align="center">
                    Memories
                </Typography>
                <img className={classes.image} src={memories} alt="img" height="60"></img>
            </div>
            <Toolbar className={classes.toolbar}>
                {user ? (
                    <div className={classes.profile}>
                        <Avatar className={classes.purple} alt={user.result.name} src={user.result.imageUrl}>{user.result.name.charAt(0)}</Avatar>
                        <Typography className={classes.userName} variant="h6">{user.result.name}</Typography>
                        <Button variant="contained" className={classes.logout} color="secondary" onClick={logout}>Logout</Button>
                    </div>
                ) : (
                       <Button component={Link} to="/auth" variant="contained" color="primary">Sign in</Button>
                )}
            </Toolbar>
      </AppBar>
    )
}

export default Navbar
