import { CounterModel } from '../models/Counter.js';
async function nextCounter(name) {
    const counter = await CounterModel.findOneAndUpdate({ name }, { $inc: { value: 1 } }, { new: true, upsert: true });
    return counter.value;
}
export async function generateReferenceCode() {
    const year = new Date().getFullYear();
    const value = await nextCounter(`complaint:${year}`);
    return `LC-${year}-${String(value).padStart(4, '0')}`;
}
export async function generateAnonymousLabel() {
    const value = await nextCounter('anonymous');
    return `Anonymous${value}`;
}
