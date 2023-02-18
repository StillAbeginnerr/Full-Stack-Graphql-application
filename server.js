const { ApolloServer, gql } = require("apollo-server");
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
// Connect to MongoDB database
const db = "mongodb://dbs:8ih46RufdTOxQzuW@ac-xq8jdv7-shard-00-00.09ymbk8.mongodb.net:27017,ac-xq8jdv7-shard-00-01.09ymbk8.mongodb.net:27017,ac-xq8jdv7-shard-00-02.09ymbk8.mongodb.net:27017/?ssl=true&replicaSet=atlas-14gqnp-shard-0&authSource=admin&retryWrites=true&w=majority";


const connectDB = async () => {
    try {
        // mongoose.set('strictQuery', false),
        await mongoose.connect(db, {
            useNewUrlParser: true,
        });
        console.log("DataBase Connected");
    } catch (error) {
        console.log(error);
    }
};

connectDB();
//user 
const UserSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    }
  });
  
  const User = mongoose.model('User', UserSchema);

// Define employee schema and model
const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  salary: {
    type: String,
    required: true,
  },
});

const Employee = mongoose.model("Employee", employeeSchema);
const employ=[]
fetchdata();

async function fetchdata()
{
  const userData = await Employee.find().exec();
  
  for(let i=0; i<userData.length; i++)
  {
    employ.push(userData[i]);
  }
}

// Define GraphQL schema
const typeDefs = gql`
  type Employee {
    id: ID!
    name: String!
    email: String!
    salary: String!
  }

  type Query {
    employees: [Employee]
    getEmployeeById(id: ID!): Employee
    getUserById(id: ID!): User!
  }

  type User {
    id: ID!
    username: String!
    password: String!
  }

  
  type Mutation {
    createEmployee(name: String!, email: String!, salary: String!): Employee!
    updateEmployee(id: ID!, name: String, email: String, salary: String): Employee
    deleteEmployee(id: ID!): Employee
    signup(username: String!, password: String!): User!
    login(username: String!, password: String!): User!
    
  }
`;

// Define GraphQL resolvers
const resolvers = {
  Query: {
    getUserById: async (parent, { id }) => {
        const user = await User.findById(id);
        if (!user) {
          throw new Error(`User with ID ${id} not found`);
        }
        return user;
      },
    employees: async() => {
     const employees = await Employee.find();
    return employees.map((employee) => employee.toObject());
}
    ,
    getEmployeeById: async (parent, { id }) => {
        if (!id) {
          throw new Error(`ID argument is undefined`);
        }
        const employee = await Employee.findById(id);
        if (!employee) {
          throw new Error(`Employee with ID ${id} not found`);
        }
        return employee.toObject();
      },
  },
  Mutation: {
    signup: async (parent, { username, password }) => {
        const hashedPassword = await bcrypt.hash(password, 10);
  
        const user = new User({
          username,
          password: hashedPassword
        });
  
        await user.save();
  
        return user;
      },
      login: async (parent, { username, password }) => {
        const user = await User.findOne({ username });
  
        if (!user) {
          throw new Error('Invalid login');
        }
  
        const isValidPassword = await bcrypt.compare(password, user.password);
  
        if (!isValidPassword) {
          throw new Error('Invalid login');
        }
  
        return user;
      },
    
    createEmployee: async (parent, args) => {
      const employee = new Employee(args);
      const savedEmployee = await employee.save();
      return savedEmployee.toObject();
    },
    updateEmployee: async (parent, args) => {
      const { id, ...update } = args;
      const updatedEmployee = await Employee.findByIdAndUpdate(id, update, {
        new: true,
      });
      return updatedEmployee.toObject();
    },
    deleteEmployee: async (parent,{id}, args) => {
        if (!id) {
            throw new Error(`ID argument is undefined`);
          }
          const employee = await Employee.findById(id);
          if (!employee) {
            throw new Error(`Employee with ID ${id} not found`);
          }
        console.log(employee._id);
        const deleteid = employee._id;
      const deletedEmployee = await Employee.findByIdAndDelete(deleteid);
      return deletedEmployee.toObject();
    },
  },
};

// Create Apollo Server instance
const server = new ApolloServer({ typeDefs, resolvers });

// Start server
server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
