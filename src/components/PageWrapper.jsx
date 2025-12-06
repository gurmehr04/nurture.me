import React from 'react';
import { motion } from 'framer-motion';

const PageWrapper = ({ children, className }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`max-w-[1200px] mx-auto px-4 pb-16 pt-28 w-full ${className || ""}`}
        >
            {children}
        </motion.div>
    );
};

export default PageWrapper;
