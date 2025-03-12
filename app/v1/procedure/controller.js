const momentTZ = require("moment-timezone");
const { Types } = require("mongoose");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const httpStatus = require("http-status");

const {
    response,
    constants,
    sendSms,
    sendEmail,
} = require("../../../utils/index");
const {
    common,
    doctor,
    appointmentService,
    adminService,
} = require("../../../services/index");
const {
    User,
    Doctor,
    Hospital,
    Appointment,
    EstablishmentMaster,
    EstablishmentTiming,
    Notification,
    ProcedureMaster,
    MedicalReport,
    AppointmentFeedback,
    FAQ,
    Specialization,
    Procedure
} = require("../../../models/index");
const {
    getPagination,
    filterFormatter,
    convertToUTCTimestamp,
    objectIdFormatter,
} = require("../../../utils/helper");
const config = require("../../../config/index");
const environment = config.ENVIRONMENT === constants.SERVER.PROD;

const specializationsData = [
    { specialty: "Aesthetic Dermatologist", procedures: ["Skin Brightening", "Chemical Peels", "Laser Therapy", "Tattoo Removal", "Mole Removal"] },
    { specialty: "Aesthetic Dermatologist", procedures: ["Derma Roller", "Hair Transplant", "Vitiligo Treatment", "Hair Loss Therapy", "Botox"] },
    { specialty: "Andrologist", procedures: ["Penile Implant", "Physiological Intracytoplasmic Sperm Injection (PICSI)", "Intracytoplasmic Morphologic Sperm Injection (IMSI)", "TESE/PESE", "ICSI"] },
    { specialty: "Cardiologist", procedures: ["Angioplasty", "Pacemaker Fixation", "Percutaneous Transluminal Coronary Angioplasty (PTCA)", "Coronary Artery Bypass Surgery (CABG)"] },
    { specialty: "Colposcopist", procedures: ["Colposcopy"] },
    { specialty: "Conservative Dentist", procedures: ["Tooth Filling"] },
    { specialty: "Cosmetic/Aesthetic Dentist", procedures: ["Tooth Whitening", "Braces Treatment", "Crooked Tooth Correction"] },
    { specialty: "Dental Surgeon", procedures: ["Wisdom Teeth Removal", "Maxillofacial Surgery", "Jaw Surgery", "Dental Implant"] },
    { specialty: "Dermatologist", procedures: ["Skin Brightening", "Chemical Peels", "Laser Therapy", "Tattoo Removal", "Mole Removal"] },
    { specialty: "Dermatologist", procedures: ["Derma Roller", "Hair Transplant", "Vitiligo Treatment", "Hair Loss Therapy", "Botox"] },
    { specialty: "Diabetologist", procedures: ["Diabetes Management"] },
    { specialty: "Endocrinologist", procedures: ["Thyroid Disorder Treatment", "Diabetes Management"] },
    { specialty: "Endodontist", procedures: ["Root Canal Treatment (RCT)"] },
    { specialty: "ENT Specialist", procedures: ["Sleep Apnea Surgery"] },
    { specialty: "Gastroenterologist", procedures: ["Endoscopic Retrograde Cholangiopancreatography (ERCP)", "Colonoscopy", "Endoscopy"] },
    { specialty: "General Surgeon", procedures: ["Appendectomy", "Gallbladder Surgery", "Hernia Surgery", "Abdominal Cancer Surgery"] },
    { specialty: "Gynecologist", procedures: ["Gynaecological Surgery", "Endometriosis Treatment", "Laparoscopy", "Hysteroscopy", "Hysterectomy"] },
    { specialty: "Gynecologist Obstetrician", procedures: ["Caesarean Section", "Normal Delivery"] },
    { specialty: "Implantologist", procedures: ["Dental Implant"] },
    { specialty: "Infertility Specialist", procedures: ["IVF", "ICSI", "IUI", "Blastocyst Transfer", "Frozen Embryo Transfer (FET)"] },
    { specialty: "Infertility Specialist", procedures: ["Egg Freezing", "Embryo Vitrification", "Altruistic Surrogacy"] },
    { specialty: "Joint Replacement Surgeon", procedures: ["Knee Replacement", "Hip Replacement", "Joint Replacement Surgery"] },
    { specialty: "Kidney Transplant Surgeon", procedures: ["Kidney Stone Surgery", "Kidney Transplant Surgery"] },
    { specialty: "Laparoscopic Surgeon", procedures: ["Laparoscopic Surgery", "Hernia Surgery", "Gallbladder Surgery"] },
    { specialty: "Neurologist", procedures: ["Epilepsy Treatment"] },
    { specialty: "Oncologist", procedures: ["Cancer Treatment", "Breast Cancer Surgery", "Head and Neck Oncology Surgery"] },
    { specialty: "Ophthalmologist", procedures: ["Cataract Surgery"] },
    { specialty: "Oral and Maxillofacial Surgeon", procedures: ["Maxillofacial Surgery", "Jaw Surgery", "Facial Trauma Surgery", "Dental Implant"] },
    { specialty: "Orthodontist", procedures: ["Orthodontic Treatment", "Braces Treatment"] },
    { specialty: "Orthopedic Surgeon", procedures: ["Rotator Cuff Repair", "Spinal Disc Surgery", "Shoulder Treatment", "Knee Replacement", "Arthroscopy Surgery"] },
    { specialty: "Orthopedic Surgeon", procedures: ["Spine Surgery", "Hip Replacement", "Anterior Cruciate Ligament (ACL) Reconstruction", "Joint Replacement Surgery"] },
    { specialty: "Plastic Surgeon", procedures: ["Flap Surgery", "Facial Trauma Surgery", "Plastic Surgery", "Breast Surgery"] },
    { specialty: "Preventive Cardiologist", procedures: ["Angioplasty", "Atrial Septal Defect (ASD) Surgery"] },
    { specialty: "Prosthodontist", procedures: ["Dental Implant"] },
    { specialty: "Reproductive Endocrinologist", procedures: ["ICSI", "IUI", "IVF", "Blastocyst Transfer", "Egg Freezing"] },
    { specialty: "Reproductive Endocrinologist", procedures: ["Embryo Vitrification"] },
    { specialty: "Trichologist", procedures: ["Hair Transplant", "Hair Loss Therapy"] },
    { specialty: "Urological Surgeon", procedures: ["Prostate Surgery", "Kidney Stone Surgery", "Stone Surgery"] },
    { specialty: "Urologist", procedures: ["Prostate Surgery", "Kidney Stone Surgery"] },
];


const addProcedures = async (req, res) => {
    try {
        for (const specializationData of specializationsData) {
            const { specialty, procedures } = specializationData;

            // Find specialization ID by name
            const specialization = await Specialization.model.findOne({ name: specialty });
            if (!specialization) {
                console.error(`Specialization not found for: ${specialty}`);
                continue;
            }

            const specializationId = specialization._id;

            // Add each procedure for the found specialization ID
            for (let i = 0; i < procedures.length; i++) {
                await Procedure.model.create({
                    specializationId,
                    name: procedures[i],
                });
                console.log(`Procedure "${procedures[i]}" added for specialization "${specialty}"`);
            }
        }

        return response.success(
            { msgCode: "PROCEDURES_ADDED" },
            res,
            httpStatus.OK
        );
    } catch (error) {
        console.error(error);
        return response.error(
            { msgCode: "SOMETHING_WENT_WRONG" },
            res,
            httpStatus.INTERNAL_SERVER_ERROR
        );
    }
};

const getProcedures = async (req, res) => {
    try {
        const { specializationId } = req.query;

        if (!ObjectId.isValid(specializationId)) {
            return response.error(
                { msgCode: "INVALID_SPECIALIZATION_ID" },
                res,
                httpStatus.BAD_REQUEST
            );
        }

        const procedures = await Procedure.find({ specializationId: new ObjectId(specializationId) });

        if (!procedures.length) {
            return response.error(
                { msgCode: "NO_PROCEDURES_FOUND" },
                res,
                httpStatus.NOT_FOUND
            );
        }

        return response.success(
            { msgCode: "PROCEDURES_FOUND", data: procedures },
            res,
            httpStatus.OK
        );
    } catch (error) {
        console.error(error);
        return response.error(
            { msgCode: "SOMETHING_WENT_WRONG" },
            res,
            httpStatus.INTERNAL_SERVER_ERROR
        );
    }
};

const getAllProcedures = async (req, res) => {
    try {
        // Fetch all specializations and procedures
        const specializations = await Specialization.model.find();
        const procedures = await Procedure.model.find({}, '_id name specializationId'); // Fetch _id, name, and specializationId fields

        // Create a map of specialization IDs to names
        const specializationMap = specializations.reduce((map, specialization) => {
            map[specialization._id.toString()] = specialization.name;
            return map;
        }, {});

        // Map procedures to include name, ID, and specialization name
        const data = procedures.map(procedure => {
            return {
                _id: procedure._id,
                name: procedure.name,
                specializationId: procedure.specializationId.toString(),
                specialization: procedure.specializationId
                    ? specializationMap[procedure.specializationId.toString()] || 'Unknown'
                    : 'Unknown'
            };
        });

        // Send successful response
        return response.success(
            { msgCode: "ALL_PROCEDURES_FOUND", data },
            res,
            httpStatus.OK
        );
    } catch (error) {
        console.error(error);
        return response.error(
            { msgCode: "SOMETHING_WENT_WRONG" },
            res,
            httpStatus.INTERNAL_SERVER_ERROR
        );
    }
};


module.exports = {
    addProcedures,
    getProcedures,
    getAllProcedures,
};