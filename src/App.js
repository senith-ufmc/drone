import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';
import 'bootstrap/dist/css/bootstrap.min.css';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBm8zdCRdPdbyPS7gUbCtdgySVinco7WOU",
  authDomain: "ufmc-2a14b.firebaseapp.com",
  databaseURL: "https://ufmc-2a14b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ufmc-2a14b",
  storageBucket: "ufmc-2a14b.appspot.com",
  messagingSenderId: "646238911686",
  appId: "1:646238911686:web:dummyid"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

function App() {
  const [droneId, setDroneId] = useState("drone1"); // default selected drone
  const [altitude, setAltitude] = useState(null);
  const [groundSpeed, setGroundSpeed] = useState(null);
  const [verticalSpeed, setVerticalSpeed] = useState(null);
  const [yaw, setYaw] = useState(null);
  const [distToMAV, setDistToMAV] = useState(null);
  const [distToWP, setDistToWP] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedIn(true);
        setEmail(user.email);
        localStorage.setItem('loggedIn', 'true');
      } else {
        setLoggedIn(false);
        localStorage.removeItem('loggedIn');
      }
    });

    if (localStorage.getItem('loggedIn') === 'true') {
      setLoggedIn(true);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    const keys = ['Altitude', 'GroundSpeed', 'VerticalSpeed', 'Yaw', 'DistToMAV', 'DistToWP'];
    const setters = [setAltitude, setGroundSpeed, setVerticalSpeed, setYaw, setDistToMAV, setDistToWP];

    const listeners = keys.map((key, index) => {
      const refPath = ref(database, `${droneId}/${key}`);
      return onValue(refPath, snapshot => setters[index](snapshot.val()));
    });

    // Cleanup listeners when drone changes
    return () => {
      listeners.forEach(unsub => unsub?.());
    };
  }, [droneId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoggedIn(true);
      setError('');
      localStorage.setItem('loggedIn', 'true');
    } catch (error) {
      console.error('Login error:', error.message);
      setError('Invalid email or password.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLoggedIn(false);
      setEmail('');
      setPassword('');
      localStorage.removeItem('loggedIn');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  const renderCircle = (label, value, unit) => (
    <div className="col-10 col-sm-6 col-md-4 mb-3 d-flex justify-content-center">
      <div className="card text-center w-100">
        <div className="card-body">
          <h5>{label}</h5>
          <div className="circle d-flex justify-content-center align-items-center mx-auto" style={{
            height: '120px',
            width: '120px',
            borderRadius: '50%',
            backgroundColor: '#3d5875',
            color: '#00ff00',
            fontWeight: 'bold'
          }}>
            {value !== null ? `${value} ${unit}` : '--'}
          </div>
        </div>
      </div>
    </div>
  );

  if (!loggedIn) {
    return (
      <div className="container-fluid d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f4f4f4' }}>
        <div className="w-100" style={{ maxWidth: '400px' }}>
          <div className="card p-4">
            <img
              src={`${process.env.PUBLIC_URL}/logo512.jpg`}
              alt="Logo"
              className="img-fluid mb-4 mx-auto d-block"
              style={{ width: '150px', height: '150px', objectFit: 'cover' }}
            />
            <h3 className="text-center">Login</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label text-center w-100">Email</label>
                <input
                  type="email"
                  className="form-control text-center"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label text-center w-100">Password</label>
                <input
                  type="password"
                  className="form-control text-center"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100">Login</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container d-flex flex-column align-items-center justify-content-start py-4" style={{ minHeight: '100vh' }}>
      <h2 className="mb-4 text-center">Drone Realtime Dashboard</h2>

      {/* Dropdown for selecting drone */}
      <div className="mb-4">
        <label className="form-label me-2">Select Drone:</label>
        <select
          className="form-select"
          style={{ minWidth: '200px' }}
          value={droneId}
          onChange={(e) => setDroneId(e.target.value)}
        >
          <option value="drone1">Drone 1</option>
          <option value="drone2">Drone 2</option>
          <option value="drone3">Drone 3</option>
        </select>
      </div>

      <div className="row w-100 justify-content-center">
        {renderCircle('Altitude', altitude, 'm')}
        {renderCircle('Ground Speed', groundSpeed, 'm/s')}
        {renderCircle('Vertical Speed', verticalSpeed, 'm/s')}
        {renderCircle('Yaw', yaw, '°')}
        {renderCircle('Distance to MAV', distToMAV, 'm')}
        {renderCircle('Distance to WP', distToWP, 'm')}
      </div>

      <button
        className="btn btn-danger mt-auto mt-5"
        onClick={handleLogout}
        style={{ width: '150px' }}
      >
        Logout
      </button>
    </div>
  );
}

export default App;
