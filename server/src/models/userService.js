const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const createUser = async (firstName, lastName, email, phone, school, hashedPassword) => {
    return await prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            phone,
            school,
            password: hashedPassword
        }
    });
};

const findUserByEmail = async (email) => {
    return await prisma.user.findUnique({
        where: { email }
    });
};

module.exports = { createUser, findUserByEmail };
