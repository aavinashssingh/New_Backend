const mongoose = require("mongoose");
const httpStatus = require("http-status");
const {
    response,
    constants,
} = require("../../../utils/index");

const {
    Specialization,
    Service
} = require("../../../models/index");
const {
} = require("../../../utils/helper");
const config = require("../../../config/index");
const environment = config.ENVIRONMENT === constants.SERVER.PROD;

const servicesData = [
    { specialty: "Aesthetic Dermatologist", services: ["Skin rejuvenation", "Anti-aging treatments", "Chemical peels", "Laser therapy", "Botox and fillers"] },
    { specialty: "Allergists/Immunologists", services: ["Allergy diagnosis and treatment", "Asthma management", "Immune system disorders treatment", "Allergy testing", "Immunotherapy (allergy shots)"] },
    { specialty: "Andrologist", services: ["Male reproductive health", "Male infertility treatment", "Erectile dysfunction treatment", "Prostate disorders"] },
    { specialty: "Anesthesiologist", services: ["Anesthesia administration", "Pain management", "Pre-operative care", "Post-operative care"] },
    { specialty: "Ayurveda", services: ["Herbal treatments", "Panchakarma (detoxification)", "Diet and lifestyle advice", "Holistic health practices"] },
    { specialty: "Cardiologist", services: ["Heart disease diagnosis", "ECG", "Echocardiography", "Stress tests", "Hypertension management"] },
    { specialty: "Colposcopist", services: ["Colposcopy", "Biopsy procedures", "Follow-up for abnormal Pap smears"] },
    { specialty: "Conservative Dentist", services: ["Dental fillings", "Root canal treatment", "Treatment of dental caries", "Preservation of natural teeth"] },
    { specialty: "Cosmetic/Aesthetic Dentist", services: ["Teeth whitening", "Veneers", "Dental bonding", "Smile makeovers", "Aesthetic dental restorations"] },
    { specialty: "Cosmetologist", services: ["Skincare treatments", "Hair removal", "Makeup application", "Beauty treatments"] },
    { specialty: "Dental Surgeon", services: ["Tooth extractions", "Oral surgery", "Dental implants", "Wisdom teeth removal", "Corrective jaw surgery"] },
    { specialty: "Dentist", services: ["Routine dental care", "Cleanings", "Fillings", "Crowns", "Bridges","Testing Gurmeet"] },
    { specialty: "Dermatologist", services: ["Skin disorder diagnosis", "Acne treatment", "Eczema and psoriasis management", "Skin cancer screening"] },
    { specialty: "Dermatosurgeon", services: ["Skin condition surgeries", "Mole removal", "Skin cancer surgery", "Scar revision"] },
    { specialty: "Diabetologist", services: ["Diabetes management", "Glucose monitoring", "Dietary advice", "Insulin therapy"] },
    { specialty: "Dietitian Nutritionist", services: ["Personalized diet plans", "Nutritional counseling", "Weight management", "Chronic disease dietary management"] },
    { specialty: "ENT Specialist", services: ["Ear, nose, and throat disorder treatment", "Hearing loss treatment", "Sinusitis treatment", "Tonsillectomy"] },
    { specialty: "Endocrinologist", services: ["Hormonal disorder management", "Diabetes treatment", "Thyroid disorder treatment", "Osteoporosis care"] },
    { specialty: "Endodontist", services: ["Root canal therapy", "Dental pulp disease treatment", "Periapical surgeries"] },
    { specialty: "Epidemiologist", services: ["Disease pattern study", "Outbreak investigation", "Public health research", "Disease prevention strategies"] },
    { specialty: "Family Physician", services: ["General healthcare", "Preventive care", "Illness diagnosis and treatment"] },
    { specialty: "Fetal Medicine Specialist", services: ["Prenatal screening", "High-risk pregnancy management", "Fetal ultrasound", "Genetic counseling"] },
    { specialty: "Gastroenterologist", services: ["Digestive disorder diagnosis", "Colonoscopy", "Endoscopy", "IBS treatment", "Liver disease management"] },
    { specialty: "General Physician", services: ["General medical care", "Illness diagnosis", "Preventive care", "Chronic condition management"] },
    { specialty: "General Surgeon", services: ["Surgical procedures", "Appendectomy", "Hernia repair", "Gallbladder surgery"] },
    { specialty: "Geriatrician", services: ["Elderly care", "Chronic disease management", "Dementia care", "Fall prevention"] },
    { specialty: "Gynecologist", services: ["Women's reproductive health", "Menstrual disorders", "Contraception", "Pelvic exams"] },
    { specialty: "Gynecologist Obstetrician", services: ["Prenatal care", "Childbirth", "Postpartum care", "Reproductive disorder treatment", "Gynecological surgeries"] },
    { specialty: "Hepatologist", services: ["Liver disease diagnosis", "Hepatitis treatment", "Cirrhosis care", "Liver transplant care"] },
    { specialty: "Homeopath", services: ["Homeopathic remedies", "Holistic treatment approach", "Personalized care"] },
    { specialty: "Implantologist", services: ["Dental implants", "Bone grafting", "Implant-supported dentures", "Advanced dental prosthetics"] },
    { specialty: "Infertility Specialist", services: ["Infertility diagnosis and treatment", "IVF", "IUI", "Egg/sperm donation", "Fertility preservation"] },
    { specialty: "Interventional Radiologist", services: ["Imaging-guided minimally invasive procedures", "Angioplasty", "Embolization", "Biopsy", "Stent placement"] },
    { specialty: "Joint Replacement Surgeon", services: ["Hip, knee, and shoulder joint replacements", "Pre-operative care", "Post-operative care", "Rehabilitation"] },
    { specialty: "Kidney Transplant Surgeon", services: ["Kidney transplant surgery", "Donor evaluation", "Post-transplant care", "Transplant complication management"] },
    { specialty: "Laparoscopic Surgeon", services: ["Minimally invasive surgeries", "Gallbladder removal", "Hernia repair", "Appendectomy"] },
    { specialty: "Nephrologist", services: ["Kidney disease management", "Dialysis", "Electrolyte disorder treatment", "Hypertension management"] },
    { specialty: "Neurologist", services: ["Neurological disorder diagnosis", "Stroke management", "Epilepsy treatment", "Parkinson's disease care"] },
    { specialty: "Oncologist", services: ["Cancer diagnosis and treatment", "Chemotherapy", "Radiation therapy", "Cancer screening"] },
    { specialty: "Ophthalmologist", services: ["Eye care", "Cataract surgery", "Glaucoma treatment", "LASIK", "Retinal disease management"] },
    { specialty: "Oral and Maxillofacial Surgeon", services: ["Facial surgery", "Oral surgery", "Jaw surgery", "Dental implants", "Trauma surgery"] },
    { specialty: "Orthodontist", services: ["Braces", "Invisalign", "Malocclusion treatment", "Bite issue correction"] },
    { specialty: "Orthopedic Surgeon", services: ["Bone and joint surgery", "Fracture repair", "Sports injury treatment", "Joint replacements", "Spine surgery"] },
    { specialty: "Pediatric Dentist", services: ["Child dental care", "Cavity prevention", "Early orthodontic assessments", "Fluoride treatments"] },
    { specialty: "Pediatrician", services: ["Child healthcare", "Immunizations", "Growth and development monitoring", "Childhood illness treatment"] },
    { specialty: "Physiotherapist", services: ["Rehabilitation", "Pain management", "Physical therapy", "Post-surgical recovery"] },
    { specialty: "Plastic Surgeon", services: ["Cosmetic surgeries", "Reconstructive surgeries", "Rhinoplasty", "Breast augmentation", "Burn treatment"] },
    { specialty: "Preventive Cardiologist", services: ["Heart disease risk assessment", "Lifestyle modification", "Cholesterol management", "Heart disease prevention"] },
    { specialty: "Prosthodontist", services: ["Dental prosthetics", "Dentures", "Bridges", "Restoration of missing teeth"] },
    { specialty: "Psychiatrist", services: ["Mental health diagnosis", "Medication management", "Psychotherapy", "Counseling"] },
    { specialty: "Psychologist", services: ["Mental health counseling", "Cognitive-behavioral therapy", "Psychological assessments"] },
    { specialty: "Pulmonologist", services: ["Lung and respiratory disorder treatment", "Asthma management", "Sleep apnea treatment", "Lung function testing"] },
    { specialty: "Radiation Oncologist", services: ["Cancer treatment with radiation therapy", "Treatment planning", "Side effect management"] },
    { specialty: "Radiologist", services: ["Medical imaging", "X-rays", "MRIs", "CT scans", "Ultrasound"] },
    { specialty: "Reproductive Endocrinologist", services: ["Fertility treatment", "Hormonal disorders management", "IVF", "Reproductive issues management"] },
    { specialty: "Sexologist", services: ["Sexual health treatment", "Sexual dysfunction counseling", "STI treatment"] },
    { specialty: "Trichologist", services: ["Hair and scalp disorder diagnosis", "Hair loss management", "Scalp therapy"] },
    { specialty: "Urological Surgeon", services: ["Urinary tract surgery", "Kidney stones treatment", "Prostate surgery", "Bladder disorder treatment"] },
    { specialty: "Urologist", services: ["Urinary tract condition diagnosis", "Male reproductive health", "Incontinence management", "Prostate care"] }
];


const addServices = async (req, res) => {
    try {
        for (const serviceData of servicesData) {
            const { specialty, services } = serviceData;

            // Find specialization ID by name
            const specialization = await Specialization.model.findOne({ name: specialty });
            if (!specialization) {
                console.error(`Specialization not found for: ${specialty}`);
                continue;
            }

            const specializationId = specialization._id;

            // Add each service for the found specialization ID
            for (let i = 0; i < services.length; i++) {
                await Service.model.create({
                    specializationId,
                    name: services[i],
                });
                console.log(`Service "${services[i]}" added for specialization "${specialty}"`);
            }
        }

        return response.success(
            { msgCode: "SERVICES_ADDED" },
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
const getAllServices = async (req, res) => {
    try {
        // Fetch all specializations and services
        const specializations = await Specialization.model.find();
        const services = await Service.model.find({}, '_id name specializationId'); // Fetch _id, name, and specializationId fields

        // Create a map of specialization IDs to names
        const specializationMap = specializations.reduce((map, specialization) => {
            map[specialization._id.toString()] = specialization.name;
            return map;
        }, {});

        // Map services to include name, ID, and specialization name
        const data = services.map(service => {
            return {
                _id: service._id,
                name: service.name,
                specialization: service.specializationId
                    ? specializationMap[service.specializationId.toString()] || 'Unknown'
                    : 'Unknown'
            };
        });

        // Send successful response
        return response.success(
            { msgCode: "ALL_SERVICES_FOUND", data },
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
    addServices,
    getAllServices
};