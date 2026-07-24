import mongoose, { Schema, type InferSchemaType } from "mongoose";

const counterSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    value: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type CounterDocument = InferSchemaType<typeof counterSchema>;
export const CounterModel = mongoose.model("Counter", counterSchema);
