const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const createUser = async (email, hashedPassword) => {
    return await prisma.user.create({
        data: { email, password: hashedPassword }
    });
};

const findUserByEmail = async (email) => {
    return await prisma.user.findUnique({
        where: { email }
    });
};

module.exports = { createUser, findUserByEmail };
