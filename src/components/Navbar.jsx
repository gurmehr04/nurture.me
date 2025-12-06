import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { styles } from '../style';
import { UserContext } from '../context/UserContext';
import menu from '../assets/menu.svg';
import close from '../assets/close.svg';
import profile from '../assets/profile-user.png';
import { navLinks } from '../constants';
import { motion } from "framer-motion";

const Navbar = () => {
    const [toggle, setToggle] = useState(false);
    const { user, logout } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <motion.nav
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full flex items-center py-5 fixed top-0 z-50 bg-[#222222]/90 backdrop-blur-lg border-b border-white/10 shadow-lg`}
        >
            <div className="w-full flex justify-between items-center max-w-[1200px] mx-auto px-4">
                <Link
                    to="/"
                    className="flex items-center gap-2"
                    onClick={() => {
                        window.scrollTo(0, 0);
                    }}
                >
                    <p className="text-white text-[25px] font-bold cursor-pointer tracking-wide">
                        Nurture<span className="text-primary">.Me</span>
                    </p>
                </Link>

                <ul className="list-none hidden sm:flex flex-row gap-10">
                    {navLinks.map((link) => (
                        <li
                            key={link.id}
                            className={`${isActive(link.path) ? 'text-primary' : 'text-gray-300 hover:text-white'} text-[18px] font-medium cursor-pointer transition-colors duration-200`}
                        >
                            <Link to={link.path}>{link.title}</Link>
                        </li>
                    ))}

                    <li
                        className={`${isActive('/write-predict') ? 'text-primary' : 'text-gray-300 hover:text-white'} text-[18px] font-medium cursor-pointer transition-colors duration-200`}
                    >
                        <Link to="/write-predict">Journal</Link>
                    </li>

                    {/* Profile & Logout */}
                    {user ? (
                        <>
                            <li className={`${isActive('/profile') ? 'border-primary' : 'border-transparent'} border-2 rounded-full p-0.5 transition-all`}>
                                <Link to="/profile">
                                    <img
                                        src={profile}
                                        alt="Profile"
                                        className="w-8 h-8 object-contain cursor-pointer"
                                    />
                                </Link>
                            </li>
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="text-white bg-red-500/80 hover:bg-red-600 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                                >
                                    Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        <li>
                            <Link
                                to="/login"
                                className="bg-primary text-dark font-semibold px-6 py-2 rounded-full hover:bg-yellow-300 transition-all shadow-md"
                            >
                                Login
                            </Link>
                        </li>
                    )}
                </ul>
            </div>

            {/* Mobile Menu */}
            <div className="sm:hidden flex flex-1 justify-end items-center">
                <img
                    src={toggle ? menu : close}
                    alt="Menu"
                    className="w-8 h-8 object-contain cursor-pointer contrast-125"
                    onClick={() => setToggle(!toggle)}
                />
                <div
                    className={`${!toggle ? 'hidden' : 'flex'} p-6 bg-dark/95 backdrop-blur-xl absolute top-20 right-0 mx-4 my-2 min-w-[200px] z-10 rounded-2xl border border-white/10 shadow-2xl`}
                >
                    <ul className="list-none flex justify-end items-start flex-col gap-6 w-full">
                        {navLinks.map((link) => (
                            <li
                                key={link.id}
                                className={`${isActive(link.path) ? 'text-primary' : 'text-white'} text-[18px] font-medium cursor-pointer w-full`}
                                onClick={() => setToggle(false)}
                            >
                                <Link to={link.path}>{link.title}</Link>
                            </li>
                        ))}

                        <li
                            className={`${isActive('/write-predict') ? 'text-primary' : 'text-white'} text-[18px] font-medium cursor-pointer`}
                            onClick={() => setToggle(false)}
                        >
                            <Link to="/write-predict">Journal</Link>
                        </li>

                        {user ? (
                            <>
                                <li onClick={() => setToggle(false)}>
                                    <Link to="/profile" className="flex items-center gap-2 text-white">
                                        <img src={profile} alt="Profile" className="w-6 h-6" /> Profile
                                    </Link>
                                </li>
                                <li className="w-full">
                                    <button
                                        onClick={() => { handleLogout(); setToggle(false); }}
                                        className="text-white bg-red-500 w-full py-2 rounded-lg"
                                    >
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <li className="w-full">
                                <Link
                                    to="/login"
                                    className="block text-center bg-primary text-dark font-bold py-2 rounded-lg w-full"
                                    onClick={() => setToggle(false)}
                                >
                                    Login
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
