import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { styles } from '../style';
import { UserContext } from '../context/UserContext'; // Import UserContext

import menu from '../assets/menu.svg';
import close from '../assets/close.svg';
import profile from '../assets/profile-user.png';
import { navLinks } from '../constants';

const Navbar = () => {
    const [active, setActive] = useState('');
    const [toggle, setToggle] = useState(false);
    const { user, logout } = useContext(UserContext); // Access user and logout function from UserContext
    const navigate = useNavigate(); // For navigation on logout
    const location = useLocation();

    const handleLogout = () => {
        logout(); // Call the logout function
        navigate('/'); // Redirect to home after logout
    };

    return (
        <nav className={`${styles.paddingX} w-full flex items-center py-7 fixed top-0 z-20 bg-[#222222]`}>
            <div className="w-full flex justify-between items-center max-w-7xl mx-auto">
                <Link
                    to="/"
                    className="flex items-center gap-2"
                    onClick={() => {
                        setActive('');
                        window.scrollTo(0, 0);
                    }}
                >
                    <p className="text-white text-[25px] font-bold cursor-pointer">
                        Nurture<span className="text-[#ffec95]">.Me</span>
                    </p>
                </Link>

                <ul className="list-none hidden sm:flex flex-row gap-10">
                    {/* Render nav links */}
                    {navLinks.map((link) => (
                        <li
                            key={link.id}
                            className={`${
                                active === link.title ? 'text-[#ffed2c]' : 'text-[#fff6d4]'
                            } text-[20px] font-medium cursor-pointer`}
                            onClick={() => setActive(link.title)}
                        >
                            <Link to={link.path}>{link.title}</Link>
                        </li>
                    ))}

                    {/* Conditionally show Profile and Logout if user is logged in */}
                    {user ? (
                        <>
                            <li key="profile" onClick={() => setActive('profile')}>
                                <Link to="/profile">
                                    <img
                                        src={profile}
                                        alt="Profile"
                                        className="w-8 object-contain cursor-pointer"
                                    />
                                </Link>
                            </li>
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="text-white bg-red-500 px-4 py-2 rounded-md cursor-pointer"
                                >
                                    Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        // Show Login link if user is not logged in
                        <li>
                            <Link
                                to="/Login"
                                className="text-white text-[20px] font-medium cursor-pointer"
                            >
                                Login
                            </Link>
                        </li>
                    )}
                </ul>
            </div>

            {/* Mobile view menu */}
            <div className="sm:hidden flex flex-1 justify-end items-center">
                <img
                    src={toggle ? menu : close}
                    alt="Menu"
                    className="w-19 h-19 object-contain cursor-pointer"
                    onClick={() => {
                        setToggle(!toggle);
                    }}
                />
                <div
                    className={`${
                        toggle ? 'hidden' : 'flex'
                    } p-6 black-gradient absolute top-20 right-0 mx-4 my-2 min-w-[140px] z-10 rounded-xl`}
                >
                    <ul className="list-none flex sm:flex justify-end items-start flex-col gap-4">
                        {/* Render nav links */}
                        {navLinks.map((link) => (
                            <li
                                key={link.id}
                                className={`${
                                    active === link.title ? 'text-[#ffed2c]' : 'text-[#000000]'
                                } text-[18px] font-medium cursor-pointer`}
                                onClick={() => {
                                    setActive(link.title);
                                    setToggle(!toggle);
                                }}
                            >
                                <Link to={link.path}>{link.title}</Link>
                            </li>
                        ))}

                        {/* Conditionally show Profile and Logout if user is logged in */}
                        {user ? (
                            <>
                                <li key="profile" onClick={() => setActive('profile')}>
                                    <Link to="/profile">
                                        <img
                                            src={profile}
                                            alt="Profile"
                                            className="w-8 object-contain cursor-pointer"
                                        />
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="text-white bg-red-500 px-4 py-2 rounded-md cursor-pointer"
                                    >
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            // Show Login link if user is not logged in
                            <li>
                                <Link
                                    to="/Login"
                                    className="text-black text-[18px] font-medium cursor-pointer"
                                    onClick={() => setToggle(!toggle)}
                                >
                                    Login
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
