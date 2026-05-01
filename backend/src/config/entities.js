export const entityConfig = {
  admin: { id: "admin_id", columns: ["name", "email"] },
  approval: {
    id: "approval_id",
    columns: ["request_id", "doctor_id", "admin_id", "approval_status", "approval_date"],
  },
  doctor: { id: "doctor_id", columns: ["name", "specialization", "experience"] },
  donation_request: {
    id: "request_id",
    columns: ["recipient_id", "organ_type", "request_date", "status"],
  },
  donor: { id: "donor_id", columns: ["name", "age", "blood_group", "phone", "address"] },
  hospital: { id: "hospital_id", columns: ["name", "city", "state"] },
  insurance: { id: "insurance_id", columns: ["recipient_id", "provider", "amount"] },
  location_tracking: {
    id: "tracking_id",
    columns: ["transport_id", "current_location", "status", "update_time"],
  },
  match_record: {
    id: "match_id",
    columns: ["donor_id", "recipient_id", "organ_id", "compatibility_id", "match_status"],
  },
  medical_test: {
    id: "test_id",
    columns: ["donor_id", "recipient_id", "test_type", "result", "test_date"],
  },
  ngo_funding: { id: "funding_id", columns: ["recipient_id", "ngo_name", "amount"] },
  organ: { id: "organ_id", columns: ["donor_id", "organ_type"] },
  organ_availability: {
    id: "availability_id",
    columns: ["organ_id", "status", "available_from"],
  },
  organ_compatibility: {
    id: "compatibility_id",
    columns: [
      "donor_id",
      "recipient_id",
      "blood_match",
      "tissue_match",
      "age_factor",
      "compatibility_score",
    ],
  },
  payment: { id: "payment_id", columns: ["surgery_id", "amount", "payment_status"] },
  recipient: {
    id: "recipient_id",
    columns: ["name", "age", "blood_group", "required_organ", "urgency_level", "phone"],
  },
  surgery: {
    id: "surgery_id",
    columns: ["match_id", "doctor_id", "surgery_date", "surgery_status"],
  },
  transplant_center: { id: "center_id", columns: ["hospital_id", "center_name"] },
  transport: {
    id: "transport_id",
    columns: [
      "organ_id",
      "team_id",
      "vehicle_id",
      "source_hospital",
      "destination_hospital",
      "transport_status",
    ],
  },
  transport_team: { id: "team_id", columns: ["team_name", "contact"] },
  transport_vehicle: { id: "vehicle_id", columns: ["type", "number_plate"] },
};

export const listEntities = Object.keys(entityConfig);
