const {
  generateHospitalSlugs,
  generateDoctorSlugs,
} = require("../services/cron");
const httpStatus = require("http-status");
const response = require("./response");
const fs = require("fs");

const cronForSlug = async (req, res) => {
  try {
    await generateDoctorSlugs();
    await generateHospitalSlugs();
    console.log("success");
    fs.appendFileSync(`${global.appRoot}/cron.txt`, "successful \n");
    return response.success(
      {
        msgCode: "SUCCESS",
        data: {},
      },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.log(error);
    fs.appendFileSync(`${global.appRoot}/cron.txt`, error + "\n \n");
    return response.error(
      {
        msgCode: "INTERNAL_SERVER_ERROR",
      },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

module.exports = { cronForSlug };
