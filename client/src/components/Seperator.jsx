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
