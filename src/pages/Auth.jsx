import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, Lock, Eye, EyeOff, User, MapPin, Phone, Mail } from 'lucide-react';
import { reverseGeocode, geocodeManualAddress } from '../services/db';

export default function Auth() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target
  const from = location.state?.from?.pathname || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Manage login page background class
  useEffect(() => {
    document.body.classList.add('login-bg');
    return () => {
      document.body.classList.remove('login-bg');
    };
  }, []);

  // Mode state: 'login' | 'register'
  const [mode, setMode] = useState('login');
  
  // Form input fields
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation errors
  const [mobileError, setMobileError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register states
  const [registerForm, setRegisterForm] = useState({
    shopName: '',
    ownerName: '',
    mobile: '',
    email: '',
    address: '',
    password: ''
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [addressDetails, setAddressDetails] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualAddressForm, setManualAddressForm] = useState({
    houseNumber: '',
    street: '',
    area: '',
    landmark: '',
    pincode: ''
  });

  const handleAddCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const geoData = await reverseGeocode(latitude, longitude);
          const addr = geoData.address || {};
          
          const city = addr.city || addr.town || addr.village || addr.municipality || "";
          const district = addr.county || addr.district || addr.state_district || "";
          const state = addr.state || "";
          const pincode = addr.postcode || "";
          
          const isSiddipet = 
            state.toLowerCase().includes("telangana") &&
            (city.toLowerCase().includes("siddipet") || district.toLowerCase().includes("siddipet"));
            
          if (!isSiddipet) {
            setError("Sorry! Gayathri Cutmit Wholesale currently delivers only within Siddipet, Telangana.");
            setAddressDetails(null);
            setGpsLoading(false);
            return;
          }
          
          const street = addr.road || "";
          const area = addr.suburb || addr.neighbourhood || addr.residential || "";
          const houseNumber = addr.house_number || "";
          
          const fullAddr = `${houseNumber ? 'H.No ' + houseNumber + ', ' : ''}${street ? street + ', ' : ''}${area ? area + ', ' : ''}Siddipet, Telangana - ${pincode}`.trim();
          
          const deliveryAddr = {
            houseNumber,
            street,
            area,
            landmark: "",
            city: "Siddipet",
            district: "Siddipet",
            state: "Telangana",
            pincode,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            fullAddress: fullAddr,
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          setAddressDetails(deliveryAddr);
          setRegisterForm(prev => ({
            ...prev,
            address: fullAddr
          }));
        } catch (err) {
          console.error(err);
          setError("Failed to fetch address from location. Please enter manually.");
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError("Location access denied or unavailable. Please enter address manually.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSaveManualAddress = async (e) => {
    e.preventDefault();
    setError('');
    const { houseNumber, street, area, landmark, pincode } = manualAddressForm;
    if (!houseNumber || !street || !area || !pincode) {
      setError("Please fill all required manual address fields.");
      return;
    }
    
    setGpsLoading(true);
    try {
      const geoResult = await geocodeManualAddress(street, area, pincode);
      const addr = geoResult.address || {};
      
      const city = addr.city || addr.town || addr.village || addr.municipality || "";
      const district = addr.county || addr.district || addr.state_district || "";
      const state = addr.state || "";
      
      const isSiddipet = 
        state.toLowerCase().includes("telangana") &&
        (city.toLowerCase().includes("siddipet") || district.toLowerCase().includes("siddipet"));
        
      if (!isSiddipet) {
        setError("Sorry! Gayathri Cutmit Wholesale currently delivers only within Siddipet, Telangana.");
        setGpsLoading(false);
        return;
      }
      
      const fullAddr = `H.No ${houseNumber}, ${street}, ${area}, ${landmark ? landmark + ', ' : ''}Siddipet - ${pincode}, Telangana`;
      
      const deliveryAddr = {
        houseNumber,
        street,
        area,
        landmark: landmark || "",
        city: "Siddipet",
        district: "Siddipet",
        state: "Telangana",
        pincode,
        latitude: geoResult.lat ? geoResult.lat.toString() : "18.1018",
        longitude: geoResult.lon ? geoResult.lon.toString() : "78.8523",
        fullAddress: fullAddr,
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setAddressDetails(deliveryAddr);
      setRegisterForm(prev => ({
        ...prev,
        address: fullAddr
      }));
      setShowManualForm(false);
    } catch (err) {
      console.error(err);
      setError("Address validation failed. Please check pincode/details.");
    } finally {
      setGpsLoading(false);
    }
  };

  const validateMobile = (value) => {
    let err = '';
    if (!value) {
      err = 'Mobile Number is required.';
    } else if (value.length !== 10) {
      err = 'Enter valid mobile number';
    }
    setMobileError(err);
    return err;
  };

  const validateEmail = (value) => {
    let err = '';
    if (!value || !value.trim()) {
      err = 'Email Address is required.';
    } else if (!value.trim().toLowerCase().endsWith('@gmail.com')) {
      err = 'invalid email';
    }
    setEmailError(err);
    return err;
  };

  const validatePassword = (value) => {
    let err = '';
    if (!value) {
      err = 'Password is required.';
    } else if (value.length < 8) {
      err = 'Password must be at least 8 characters.';
    } else if (!/[a-zA-Z]/.test(value)) {
      err = 'Password must contain at least one letter.';
    } else if (!/\d/.test(value)) {
      err = 'Password must contain at least one number.';
    } else if (!/[-_!@#$*]/.test(value)) {
      err = 'Password must contain at least one special character from: -, _, !, @, #, $, *';
    } else if (/[^a-zA-Z\d\-_!@#$*]/.test(value)) {
      err = 'Password can only consist of letters, numbers, and unique characters: -, _, !, @, #, $, *';
    }
    setPasswordError(err);
    return err;
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      setSuccess('Signed in successfully! Redirecting...');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { shopName, ownerName, mobile, email, address, password } = registerForm;

    if (mobileError || emailError || passwordError) {
      setError('Please correct the validation errors.');
      return;
    }

    // Strict validation
    if (!ownerName || !ownerName.trim()) {
      setError('User Name is required.');
      return;
    }
    
    const mobileErr = validateMobile(mobile);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (mobileErr) {
      setError(mobileErr);
      return;
    }
    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (passwordErr) {
      setError(passwordErr);
      return;
    }

    if (!addressDetails) {
      setError('Please select or add a verified delivery address within Siddipet, Telangana.');
      return;
    }

    setLoading(true);
    try {
      await register({
        ...registerForm,
        deliveryAddress: addressDetails
      });
      setSuccess('Account registered successfully! Redirecting...');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center relative overflow-hidden px-4 py-8 lg:py-16">
      
      {/* 2-Column Foreground Grid Layer */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-20">
        
        {/* Left Column: Welcome Branding */}
        <div className="flex flex-col justify-center text-center lg:text-left space-y-6 select-none relative z-20 order-1 lg:max-w-xl">
          <h1 
            className="text-4xl sm:text-5xl lg:text-6xl text-[#854d0e] lowercase tracking-wide font-black opacity-0 animate-welcome-text"
            style={{ 
              fontFamily: "'Lobster', cursive",
              textShadow: '0 2px 10px rgba(255, 255, 255, 0.95), 0 1px 4px rgba(255, 255, 255, 0.9)'
            }}
          >
            Welcome to
          </h1>
          <div className="space-y-3">
            <div 
              className="text-6xl sm:text-8xl lg:text-9xl text-[#ea580c] leading-none opacity-0 animate-gayatri-text"
              style={{ 
                fontFamily: "'Lobster', cursive",
                animationDelay: '0.2s',
                textShadow: '0 4px 15px rgba(255, 255, 255, 0.95), 0 2px 6px rgba(255, 255, 255, 0.9)'
              }}
            >
              Gayathri
            </div>
            <div 
              className="text-6xl sm:text-8xl lg:text-9xl text-[#581c87] leading-none opacity-0 animate-cutmit-text"
              style={{ 
                fontFamily: "'Lobster', cursive",
                animationDelay: '0.4s',
                textShadow: '0 4px 15px rgba(255, 255, 255, 0.95), 0 2px 6px rgba(255, 255, 255, 0.9)'
              }}
            >
              Cutmit
            </div>
          </div>
        </div>

        {/* Right Column: Card Box */}
        <div className="w-full max-w-md mx-auto lg:mr-0 lg:ml-auto order-2 relative z-20 opacity-0 animate-card-entry" style={{ animationDelay: '0.6s' }}>
        <div className="bg-white rounded-[32px] shadow-2xl border border-brand-light/35 overflow-hidden flex flex-col transition-all duration-300 animate-float-card">
          
          {/* Header Branding */}
          <div className="bg-brand p-6 text-white text-center">
            <div className="inline-flex p-3 bg-brand-dark rounded-full mb-3 border-2 border-yellow-400 shadow-md">
              <Store className="h-8 w-8 text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight animate-fade-in-up">Wholesale Partner Portal</h2>
            <p className="text-xs text-brand-light mt-0.5 font-medium animate-fade-in-up">Browse, order, and track for your retail store</p>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); setMobileError(''); setEmailError(''); setPasswordError(''); }}
              className={`flex-1 py-3.5 text-sm font-black border-b-2 transition-all cursor-pointer ${mode === 'login' ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-650'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setSuccess(''); setMobileError(''); setEmailError(''); setPasswordError(''); }}
              className={`flex-1 py-3.5 text-sm font-black border-b-2 transition-all cursor-pointer ${mode === 'register' ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-650'}`}
            >
              Register
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-4 p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0 animate-ping" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-2xl border border-emerald-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 animate-ping" />
                {success}
              </div>
            )}

            {/* MODE: SIGN IN */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-sm font-bold text-gray-800 uppercase focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all placeholder:normal-case placeholder:text-gray-300"
                      required
                    />
                    <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all placeholder:text-gray-300"
                      required
                    />
                    <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand hover:bg-brand-dark text-white rounded-2xl text-sm font-black shadow-md hover:shadow-lg transition-all disabled:opacity-50 active-bounce cursor-pointer btn-premium-hover"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* MODE: REGISTER SHOP */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Shop Name (Optional)</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="shopName"
                        placeholder="e.g. Kirana Store"
                        value={registerForm.shopName}
                        onChange={handleRegisterChange}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all placeholder:text-gray-300"
                      />
                      <Store className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 pl-1">User Name *</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="ownerName"
                        placeholder="e.g. Name"
                        value={registerForm.ownerName}
                        onChange={handleRegisterChange}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all placeholder:text-gray-300"
                        required
                      />
                      <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Mobile Number *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="mobile"
                        placeholder="10-digit number"
                        value={registerForm.mobile}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g,'').slice(0,10);
                          setRegisterForm(p => ({ ...p, mobile: val }));
                          if (mobileError) {
                            validateMobile(val);
                          }
                        }}
                        onBlur={(e) => validateMobile(e.target.value)}
                        className={`w-full pl-16 pr-4 py-3 bg-gray-50 border rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all placeholder:text-gray-300 ${
                          mobileError ? 'border-red-500 focus:ring-red-500 bg-red-50/10' : 'border-gray-150'
                        }`}
                        required
                      />
                      <div className="absolute left-3 top-3.5 flex items-center gap-1 text-gray-400 border-r border-gray-200 pr-2">
                        <Phone className="h-4.5 w-4.5" />
                        <span className="text-sm font-bold text-gray-500">+91</span>
                      </div>
                    </div>
                    {mobileError && (
                      <p className="mt-1 text-xs font-semibold text-red-600 pl-1">{mobileError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Email Address *</label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        placeholder="example@gmail.com"
                        value={registerForm.email}
                        onChange={(e) => {
                          handleRegisterChange(e);
                          if (emailError) {
                            validateEmail(e.target.value);
                          }
                        }}
                        onBlur={(e) => validateEmail(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-2xl text-sm font-bold text-gray-800 uppercase focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all placeholder:normal-case placeholder:text-gray-300 ${
                          emailError ? 'border-red-500 focus:ring-red-500 bg-red-50/10' : 'border-gray-150'
                        }`}
                        required
                      />
                      <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
                    </div>
                    {emailError && (
                      <p className="mt-1 text-xs font-semibold text-red-600 pl-1">{emailError}</p>
                    )}
                  </div>
                </div>

                {/* Geolocation Address Selector Section */}
                <div className="space-y-3.5 border-t border-gray-100 pt-4">
                  <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider pl-1">Delivery Address *</label>
                  
                  {gpsLoading && (
                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-brand font-bold animate-pulse">
                      <span className="animate-spin mr-2 text-base">⏳</span> Fetching & Verifying Location Details...
                    </div>
                  )}

                  {!addressDetails && !showManualForm && !gpsLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleAddCurrentLocation}
                        className="py-3 px-4 bg-brand hover:bg-brand-dark text-white rounded-2xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 active-bounce transition-all cursor-pointer"
                      >
                        📍 Add Current Location
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setManualAddressForm({
                            houseNumber: '',
                            street: '',
                            area: '',
                            landmark: '',
                            pincode: ''
                          });
                          setShowManualForm(true);
                        }}
                        className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 active-bounce transition-all border border-gray-200 cursor-pointer"
                      >
                        📍 Select Delivery Address
                      </button>
                    </div>
                  )}

                  {showManualForm && !gpsLoading && (
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-150 space-y-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pb-1.5 border-b border-gray-100">Manual Address Entry</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">House / Flat No *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2-3-678"
                            value={manualAddressForm.houseNumber}
                            onChange={(e) => setManualAddressForm(p => ({ ...p, houseNumber: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Street Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sanjeeviah Nagar"
                            value={manualAddressForm.street}
                            onChange={(e) => setManualAddressForm(p => ({ ...p, street: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Area / Locality *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Bus Stand area"
                            value={manualAddressForm.area}
                            onChange={(e) => setManualAddressForm(p => ({ ...p, area: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Landmark (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Near Bus Stand"
                            value={manualAddressForm.landmark}
                            onChange={(e) => setManualAddressForm(p => ({ ...p, landmark: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pincode *</label>
                          <input
                            type="text"
                            required
                            maxLength="6"
                            placeholder="502103"
                            value={manualAddressForm.pincode}
                            onChange={(e) => setManualAddressForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g,'') }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">City</label>
                          <input
                            type="text"
                            disabled
                            value="Siddipet"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-400 bg-gray-100 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">State</label>
                          <input
                            type="text"
                            disabled
                            value="Telangana"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-400 bg-gray-100 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowManualForm(false)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[11px] font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveManualAddress}
                          className="px-3.5 py-1.5 bg-accent hover:bg-accent-dark text-white rounded-xl text-[11px] font-black shadow-sm cursor-pointer"
                        >
                          Save Address
                        </button>
                      </div>
                    </div>
                  )}

                  {addressDetails && !showManualForm && !gpsLoading && (
                    <div className="p-4 bg-white rounded-2xl border-2 border-brand/20 shadow-sm space-y-3.5 hover:border-brand/40 transition-all text-left">
                      <div className="flex items-start justify-between gap-2 border-b border-gray-50 pb-2">
                        <p className="text-xs font-black text-gray-800 flex items-center gap-1">
                          <span className="text-brand">📍</span> Delivery Address (Verified)
                        </p>
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                          Siddipet Area
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-gray-650 font-semibold leading-relaxed">
                        <p className="font-bold text-gray-900">{registerForm.ownerName || "Owner Name"}</p>
                        <p>H.No {addressDetails.houseNumber}</p>
                        <p>{addressDetails.street}, {addressDetails.area}</p>
                        {addressDetails.landmark && <p className="text-gray-400">Near: {addressDetails.landmark}</p>}
                        <p>Siddipet - {addressDetails.pincode}</p>
                        <p>Telangana</p>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setManualAddressForm({
                              houseNumber: addressDetails.houseNumber,
                              street: addressDetails.street,
                              area: addressDetails.area,
                              landmark: addressDetails.landmark,
                              pincode: addressDetails.pincode
                            });
                            setShowManualForm(true);
                          }}
                          className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[10px] font-black rounded-xl border border-gray-200 transition cursor-pointer"
                        >
                          ✏️ Edit Address
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddressDetails(null);
                            setRegisterForm(prev => ({ ...prev, address: '' }));
                          }}
                          className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-black rounded-xl border border-red-150 transition cursor-pointer"
                        >
                          🗑️ Remove
                        </button>
                        <button
                          type="button"
                          onClick={handleAddCurrentLocation}
                          className="flex-1 py-2 bg-brand-light hover:bg-brand text-brand hover:text-white text-[10px] font-black rounded-xl border border-brand/10 transition cursor-pointer"
                        >
                          📍 Change Location
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Choose password (min 8 chars)"
                      value={registerForm.password}
                      onChange={(e) => {
                        handleRegisterChange(e);
                        if (passwordError) {
                          validatePassword(e.target.value);
                        }
                      }}
                      onBlur={(e) => validatePassword(e.target.value)}
                      className={`w-full pl-11 pr-10 py-3 bg-gray-50 border rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all placeholder:text-gray-300 ${
                        passwordError ? 'border-red-500 focus:ring-red-500 bg-red-50/10' : 'border-gray-150'
                      }`}
                      required
                    />
                    <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="mt-1 text-xs font-semibold text-red-600 pl-1">{passwordError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !!mobileError || !!emailError || !!passwordError}
                  className="w-full py-3 bg-brand hover:bg-brand-dark text-white rounded-2xl text-sm font-black shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active-bounce cursor-pointer btn-premium-hover"
                >
                  {loading ? 'Creating Wholesale Account...' : 'Register Wholesale Account'}
                </button>
              </form>
            )}

          </div>

        </div>
      </div>
    </div>
    </div>
  );
}
