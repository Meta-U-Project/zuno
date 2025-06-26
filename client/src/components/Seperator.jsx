import { motion } from "framer-motion";

const Seperator = () => {
    return (
        <div
            viewport={{ once: true }}
            style={{
                width: "40%",
                margin: "50px auto",
                height: "3px",
                background: "linear-gradient(to right, #7735e2, #0a63ac)",
                borderRadius: "full",
                height: "3px"
            }}
        />
    );
};

export default Seperator;

// import React from "react";

// const Separator = () => {
//     return (
//         <div
//             style={{
//                 height: "1px",
//                 backgroundColor: "gray",
//                 margin: "20px auto",
//                 maxWidth: "100%",
//                 width: "100%",
//                 transition: "width 0.5s ease 0.3s"
//             }}
//         />
//     );
// };

// export default Separator;
