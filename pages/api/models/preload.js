import { DataTypes, connection } from './connection'

const preload = connection.define('Preload',{
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull:false,
        primaryKey: true
    },
    number:{
        type: DataTypes.TEXT,
        unique:true,
        allowNull:false
    },
    free:{
        type: DataTypes.BOOLEAN,
    },
    cpf:{

        type: DataTypes.TEXT,
    },
    groupid:{
        type: DataTypes.TEXT,
        
    },
    paused:{
        type: DataTypes.BOOLEAN,
        defaultValue:false
    },
    listId:{
        type:DataTypes.INTEGER,
    }


})

export default preload;
