import { postgres, DataTypes } from '../utils'

const { STRING } = DataTypes

export default postgres.define('products', {
    url: {
        type: STRING
    },
    device: {
        type: STRING
    },
    storage: {
        type: STRING
    },
}, {
    tableName: 'products',
    timestamps: false
})