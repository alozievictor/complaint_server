import mongoose, { Schema } from "mongoose";
const counterSchema = new Schema({
    name: { type: String, required: true, unique: true },
    value: { type: Number, required: true, default: 0 },
}, { timestamps: true });
export const CounterModel = mongoose.model("Counter", counterSchema);
