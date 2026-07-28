import mongoose,{Schema} from 'mongoose';

const meetingSchema = new mongoose.Schema(
    {
        user_id:{type:String},
        meetingcode:{type:String,required:true,unique:true},
        date:{type:date,default:Date.now,rquired:true}

    }
);

const meeting = mongoose.model('meeting',meetingSchema);

export{meeting};