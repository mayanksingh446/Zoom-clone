import React from 'react'
import "../App.css";
import { Link } from 'react-router-dom';

export default function landing () {
  return (
    <div className='landingPageContainer'>
        <nav>
          <div className='navHeader'>
                <h2>Video Call</h2>
          </div>
          <div className='navList'>
                <p>Join as Guest</p>
                <p>Register</p>
                <div role='button'>
                  <p>Login</p>
                </div>
          </div>
        </nav>

      <div className="landingMainContainer">
            <div>
              <h1 style={{fontSize:'3.2rem'}}><span style={{color:"#FF9839"}}>Connect</span> with your loved Ones</h1>
            
              <p style={{fontSize:'2.2rem'}}>Cover a distance by video Call</p>
              <div className='secbutton' role='button'>
                <Link to={"/auth"} > <a>Get Started</a></Link>
              </div>
            </div>
            <div>
              <img src="/mobile.png" alt="" />
            </div>
      </div>

    </div>
  )
}

