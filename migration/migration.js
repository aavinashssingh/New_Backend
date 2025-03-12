const mongoose = require("mongoose");
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
} = require("../models/index");

const updateConsultationType = async () => {
    try {
        // Step 1: Initialize consultationType and consultationDetails
        await Doctor.model.updateMany(
            { consultationType: { $exists: false } }, // Find documents without the field
            {
                $set: {
                    consultationType: 'video',
                    'consultationDetails': {
                        isVideo: false,
                        isInClinic: false
                    }
                }
            }
        );

        // Step 2: Update nested fields separately if needed
        await Doctor.model.updateMany(
            { consultationType: 'video', 'consultationDetails.isVideo': { $exists: false } }, // Find documents with consultationType 'video' and missing nested fields
            {
                $set: {
                    'consultationDetails.isVideo': false,
                    'consultationDetails.isInClinic': false
                }
            }
        );

        console.log('Migration completed successfully.');
        // Step 1: Initialize videoConsultationFees if it does not exist
        await EstablishmentTiming.model.updateMany(
            { videoConsultationFees: { $exists: false } }, // Find documents without the field
            {
                $set: {
                    videoConsultationFees: null // Set default value
                }
            }
        );

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        mongoose.disconnect();
    }
};



const migrateAddConsultationType = async (req, res) => {
    try {
        await updateConsultationType();
        // await updateVideoConsultationFees();
        return res.status(200).json({ message: 'Migration completed successfully' });
    } catch (err) {
        console.error('Migration failed', err);
        return res.status(500).json({ message: 'Migration failed', error: err.message });
    }
};

module.exports = {
    migrateAddConsultationType
};