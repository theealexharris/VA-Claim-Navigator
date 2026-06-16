import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { ProgressTracker } from "@/components/ProgressTracker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STEPS = [
  "Personal Information",
  "Military Service",
  "Disabilities",
  "Supporting Evidence",
  "Review & Submit",
];

const MILITARY_BRANCHES = [
  "Army",
  "Navy",
  "Marine Corps",
  "Air Force",
  "Space Force",
  "Coast Guard",
  "National Guard",
  "Reserves",
];

const DISCHARGE_TYPES = [
  "Honorable",
  "General Under Honorable Conditions",
  "Other Than Honorable",
  "Bad Conduct",
  "Dishonorable",
  "Entry Level Separation",
];

const DISABILITY_CATEGORIES = [
  "Musculoskeletal",
  "Mental Health",
  "Neurological",
  "Cardiovascular",
  "Respiratory",
  "Digestive",
  "Skin",
  "Hearing/Vision",
  "Other",
];

const EVIDENCE_TYPES = [
  "Service Treatment Records",
  "VA Medical Records",
  "Private Medical Records",
  "Buddy Statements",
  "Personnel Records",
  "Nexus Letter",
  "Other",
];

interface PersonalInfo {
  firstName: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface MilitaryService {
  branch: string;
  entryDate: string;
  separationDate: string;
  dischargeType: string;
  serviceNumber: string;
  unitAssignment: string;
  deployments: string;
  combatService: boolean;
}

interface Disability {
  id: string;
  name: string;
  category: string;
  description: string;
  serviceConnected: boolean;
  currentRating: string;
  onsetDate: string;
  worseningDate: string;
}

interface SupportingEvidence {
  evidenceTypes: string[];
  additionalNotes: string;
  hasPrivateRecords: boolean;
  privateRecordsDetails: string;
  hasBuddyStatements: boolean;
  buddyStatementNames: string;
}

interface ClaimData {
  personalInfo: PersonalInfo;
  militaryService: MilitaryService;
  disabilities: Disability[];
  supportingEvidence: SupportingEvidence;
}

const initialClaimData: ClaimData = {
  personalInfo: {
    firstName: "",
    lastName: "",
    ssn: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  },
  militaryService: {
    branch: "",
    entryDate: "",
    separationDate: "",
    dischargeType: "",
    serviceNumber: "",
    unitAssignment: "",
    deployments: "",
    combatService: false,
  },
  disabilities: [],
  supportingEvidence: {
    evidenceTypes: [],
    additionalNotes: "",
    hasPrivateRecords: false,
    privateRecordsDetails: "",
    hasBuddyStatements: false,
    buddyStatementNames: "",
  },
};

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export default function ClaimBuilder() {
  const [currentStep, setCurrentStep] = useState(0);
  const [claimData, setClaimData] = useState<ClaimData>(initialClaimData);
  const [newDisability, setNewDisability] = useState<Partial<Disability>>({
    serviceConnected: true,
  });
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track unsaved changes
  useEffect(() => {
    const hasData =
      claimData.personalInfo.firstName ||
      claimData.personalInfo.lastName ||
      claimData.disabilities.length > 0;
    setHasUnsavedChanges(!!hasData && !isSubmitted);
  }, [claimData, isSubmitted]);

  // Handle browser/tab close - warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setClaimData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const formatSSN = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");
    // Limit to 9 digits
    const limited = digits.slice(0, 9);
    // Format as XXX-XX-XXXX
    if (limited.length <= 3) return limited;
    if (limited.length <= 5) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
  };

  const handleSSNChange = (value: string) => {
    const formatted = formatSSN(value);
    updatePersonalInfo("ssn", formatted);
  };

  const updateMilitaryService = (
    field: keyof MilitaryService,
    value: string | boolean
  ) => {
    setClaimData((prev) => ({
      ...prev,
      militaryService: { ...prev.militaryService, [field]: value },
    }));
  };

  const addDisability = () => {
    if (!newDisability.name || !newDisability.category) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and category for the disability.",
        variant: "destructive",
      });
      return;
    }

    const disability: Disability = {
      id: generateId(),
      name: newDisability.name || "",
      category: newDisability.category || "",
      description: newDisability.description || "",
      serviceConnected: newDisability.serviceConnected ?? true,
      currentRating: newDisability.currentRating || "",
      onsetDate: newDisability.onsetDate || "",
      worseningDate: newDisability.worseningDate || "",
    };

    setClaimData((prev) => ({
      ...prev,
      disabilities: [...prev.disabilities, disability],
    }));

    setNewDisability({ serviceConnected: true });
  };

  const removeDisability = (id: string) => {
    setClaimData((prev) => ({
      ...prev,
      disabilities: prev.disabilities.filter((d) => d.id !== id),
    }));
  };

  const updateSupportingEvidence = (
    field: keyof SupportingEvidence,
    value: string | boolean | string[]
  ) => {
    setClaimData((prev) => ({
      ...prev,
      supportingEvidence: { ...prev.supportingEvidence, [field]: value },
    }));
  };

  const toggleEvidenceType = (type: string) => {
    const current = claimData.supportingEvidence.evidenceTypes;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateSupportingEvidence("evidenceTypes", updated);
  };

  const submitMutation = useMutation({
    mutationFn: async (data: ClaimData) => {
      const response = await apiRequest("POST", "/api/claims", {
        claimType: "disability",
        status: "draft",
        data: data,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      setHasUnsavedChanges(false);
      setShowSubmitDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      toast({
        title: "Claim Submitted Successfully",
        description:
          "Your claim has been saved and is ready for VA submission.",
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your claim. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setShowSubmitDialog(true);
  };

  const confirmSubmit = () => {
    submitMutation.mutate(claimData);
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Personal Information
        </h3>
        <p className="text-sm text-gray-600">
          Please provide your personal details as they appear on your military
          records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={claimData.personalInfo.firstName}
            onChange={(e) => updatePersonalInfo("firstName", e.target.value)}
            placeholder="Enter your first name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={claimData.personalInfo.lastName}
            onChange={(e) => updatePersonalInfo("lastName", e.target.value)}
            placeholder="Enter your last name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ssn">Social Security Number *</Label>
          <Input
            id="ssn"
            value={claimData.personalInfo.ssn}
            onChange={(e) => handleSSNChange(e.target.value)}
            placeholder="XXX-XX-XXXX"
            maxLength={11}
          />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={claimData.personalInfo.dateOfBirth}
            onChange={(e) => updatePersonalInfo("dateOfBirth", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={claimData.personalInfo.email}
            onChange={(e) => updatePersonalInfo("email", e.target.value)}
            placeholder="your.email@example.com"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={claimData.personalInfo.phone}
            onChange={(e) => updatePersonalInfo("phone", e.target.value)}
            placeholder="(555) 555-5555"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Street Address</Label>
        <Input
          id="address"
          value={claimData.personalInfo.address}
          onChange={(e) => updatePersonalInfo("address", e.target.value)}
          placeholder="123 Main Street"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={claimData.personalInfo.city}
            onChange={(e) => updatePersonalInfo("city", e.target.value)}
            placeholder="City"
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={claimData.personalInfo.state}
            onChange={(e) => updatePersonalInfo("state", e.target.value)}
            placeholder="State"
          />
        </div>
        <div>
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            value={claimData.personalInfo.zipCode}
            onChange={(e) => updatePersonalInfo("zipCode", e.target.value)}
            placeholder="12345"
          />
        </div>
      </div>
    </div>
  );

  const renderMilitaryService = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Military Service Information
        </h3>
        <p className="text-sm text-gray-600">
          Provide details about your military service history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="branch">Branch of Service *</Label>
          <Select
            value={claimData.militaryService.branch}
            onValueChange={(value) => updateMilitaryService("branch", value)}
          >
            <SelectTrigger id="branch">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {MILITARY_BRANCHES.map((branch) => (
                <SelectItem key={branch} value={branch}>
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dischargeType">Discharge Type *</Label>
          <Select
            value={claimData.militaryService.dischargeType}
            onValueChange={(value) =>
              updateMilitaryService("dischargeType", value)
            }
          >
            <SelectTrigger id="dischargeType">
              <SelectValue placeholder="Select discharge type" />
            </SelectTrigger>
            <SelectContent>
              {DISCHARGE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="entryDate">Entry Date *</Label>
          <Input
            id="entryDate"
            type="date"
            value={claimData.militaryService.entryDate}
            onChange={(e) => updateMilitaryService("entryDate", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="separationDate">Separation Date *</Label>
          <Input
            id="separationDate"
            type="date"
            value={claimData.militaryService.separationDate}
            onChange={(e) =>
              updateMilitaryService("separationDate", e.target.value)
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="serviceNumber">Service Number / EDIPI</Label>
          <Input
            id="serviceNumber"
            value={claimData.militaryService.serviceNumber}
            onChange={(e) =>
              updateMilitaryService("serviceNumber", e.target.value)
            }
            placeholder="Enter service number"
          />
        </div>
        <div>
          <Label htmlFor="unitAssignment">Unit Assignment</Label>
          <Input
            id="unitAssignment"
            value={claimData.militaryService.unitAssignment}
            onChange={(e) =>
              updateMilitaryService("unitAssignment", e.target.value)
            }
            placeholder="e.g., 1st Infantry Division"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="deployments">Deployment History</Label>
        <Textarea
          id="deployments"
          value={claimData.militaryService.deployments}
          onChange={(e) =>
            updateMilitaryService("deployments", e.target.value)
          }
          placeholder="List deployment locations and dates (e.g., Iraq 2004-2005, Afghanistan 2008-2009)"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="combatService"
          checked={claimData.militaryService.combatService}
          onCheckedChange={(checked) =>
            updateMilitaryService("combatService", checked as boolean)
          }
        />
        <Label htmlFor="combatService">I served in a combat zone</Label>
      </div>
    </div>
  );

  const renderDisabilities = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Disability Claims
        </h3>
        <p className="text-sm text-gray-600">
          Add each disability condition you are claiming. Be specific and
          thorough in your descriptions.
        </p>
      </div>

      {/* Existing disabilities */}
      {claimData.disabilities.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Added Conditions:</h4>
          {claimData.disabilities.map((disability) => (
            <div
              key={disability.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">
                    {disability.name}
                  </h5>
                  <p className="text-sm text-gray-600">
                    {disability.category} •{" "}
                    {disability.serviceConnected
                      ? "Service-Connected"
                      : "Not Service-Connected"}
                  </p>
                  {disability.description && (
                    <p className="text-sm text-gray-700 mt-1">
                      {disability.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeDisability(disability.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new disability */}
      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
        <h4 className="font-medium text-gray-900 mb-4">Add New Condition</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="disabilityName">Condition Name *</Label>
            <Input
              id="disabilityName"
              value={newDisability.name || ""}
              onChange={(e) =>
                setNewDisability((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., PTSD, Lower Back Pain, Tinnitus"
            />
          </div>
          <div>
            <Label htmlFor="disabilityCategory">Category *</Label>
            <Select
              value={newDisability.category || ""}
              onValueChange={(value) =>
                setNewDisability((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger id="disabilityCategory">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {DISABILITY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="disabilityDescription">Description</Label>
          <Textarea
            id="disabilityDescription"
            value={newDisability.description || ""}
            onChange={(e) =>
              setNewDisability((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Describe how this condition affects you, when it started, and how it is related to your service"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="currentRating">Current VA Rating (if any)</Label>
            <Input
              id="currentRating"
              value={newDisability.currentRating || ""}
              onChange={(e) =>
                setNewDisability((prev) => ({
                  ...prev,
                  currentRating: e.target.value,
                }))
              }
              placeholder="e.g., 0%, 30%, 70%"
            />
          </div>
          <div>
            <Label htmlFor="onsetDate">Onset Date</Label>
            <Input
              id="onsetDate"
              type="date"
              value={newDisability.onsetDate || ""}
              onChange={(e) =>
                setNewDisability((prev) => ({
                  ...prev,
                  onsetDate: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="worseningDate">Date Condition Worsened</Label>
            <Input
              id="worseningDate"
              type="date"
              value={newDisability.worseningDate || ""}
              onChange={(e) =>
                setNewDisability((prev) => ({
                  ...prev,
                  worseningDate: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="serviceConnected"
            checked={newDisability.serviceConnected ?? true}
            onCheckedChange={(checked) =>
              setNewDisability((prev) => ({
                ...prev,
                serviceConnected: checked as boolean,
              }))
            }
          />
          <Label htmlFor="serviceConnected">
            This condition is service-connected
          </Label>
        </div>

        <Button onClick={addDisability} className="w-full">
          Add Condition
        </Button>
      </div>
    </div>
  );

  const renderSupportingEvidence = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Supporting Evidence
        </h3>
        <p className="text-sm text-gray-600">
          Select all types of evidence you have to support your claim.
        </p>
      </div>

      <div>
        <Label className="text-base font-medium">Evidence Types Available</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {EVIDENCE_TYPES.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`evidence-${type}`}
                checked={claimData.supportingEvidence.evidenceTypes.includes(
                  type
                )}
                onCheckedChange={() => toggleEvidenceType(type)}
              />
              <Label htmlFor={`evidence-${type}`}>{type}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="hasPrivateRecords"
          checked={claimData.supportingEvidence.hasPrivateRecords}
          onCheckedChange={(checked) =>
            updateSupportingEvidence("hasPrivateRecords", checked as boolean)
          }
        />
        <Label htmlFor="hasPrivateRecords">
          I have private medical records to submit
        </Label>
      </div>

      {claimData.supportingEvidence.hasPrivateRecords && (
        <div>
          <Label htmlFor="privateRecordsDetails">Private Records Details</Label>
          <Textarea
            id="privateRecordsDetails"
            value={claimData.supportingEvidence.privateRecordsDetails}
            onChange={(e) =>
              updateSupportingEvidence(
                "privateRecordsDetails",
                e.target.value
              )
            }
            placeholder="Describe the private medical records you have (doctor name, facility, dates of treatment)"
            rows={3}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="hasBuddyStatements"
          checked={claimData.supportingEvidence.hasBuddyStatements}
          onCheckedChange={(checked) =>
            updateSupportingEvidence("hasBuddyStatements", checked as boolean)
          }
        />
        <Label htmlFor="hasBuddyStatements">
          I have buddy statements from fellow service members
        </Label>
      </div>

      {claimData.supportingEvidence.hasBuddyStatements && (
        <div>
          <Label htmlFor="buddyStatementNames">Buddy Statement Providers</Label>
          <Textarea
            id="buddyStatementNames"
            value={claimData.supportingEvidence.buddyStatementNames}
            onChange={(e) =>
              updateSupportingEvidence("buddyStatementNames", e.target.value)
            }
            placeholder="List the names of service members providing statements"
            rows={2}
          />
        </div>
      )}

      <div>
        <Label htmlFor="additionalNotes">Additional Notes</Label>
        <Textarea
          id="additionalNotes"
          value={claimData.supportingEvidence.additionalNotes}
          onChange={(e) =>
            updateSupportingEvidence("additionalNotes", e.target.value)
          }
          placeholder="Any additional information that might support your claim"
          rows={4}
        />
      </div>
    </div>
  );

  const renderReview = () => {
    const { personalInfo, militaryService, disabilities, supportingEvidence } =
      claimData;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Review Your Claim
          </h3>
          <p className="text-sm text-gray-600">
            Please review all information before submitting. You can go back to
            make corrections.
          </p>
        </div>

        {/* Personal Information Summary */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-600">Name:</span>
            <span>
              {personalInfo.firstName} {personalInfo.lastName}
            </span>
            <span className="text-gray-600">SSN:</span>
            <span>***-**-{personalInfo.ssn.slice(-4)}</span>
            <span className="text-gray-600">Date of Birth:</span>
            <span>{personalInfo.dateOfBirth}</span>
            <span className="text-gray-600">Email:</span>
            <span>{personalInfo.email}</span>
            <span className="text-gray-600">Phone:</span>
            <span>{personalInfo.phone}</span>
          </div>
        </div>

        {/* Military Service Summary */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Military Service</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-600">Branch:</span>
            <span>{militaryService.branch}</span>
            <span className="text-gray-600">Service Period:</span>
            <span>
              {militaryService.entryDate} to {militaryService.separationDate}
            </span>
            <span className="text-gray-600">Discharge Type:</span>
            <span>{militaryService.dischargeType}</span>
            <span className="text-gray-600">Combat Service:</span>
            <span>{militaryService.combatService ? "Yes" : "No"}</span>
          </div>
        </div>

        {/* Disabilities Summary */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            Claimed Conditions ({disabilities.length})
          </h4>
          {disabilities.length === 0 ? (
            <p className="text-sm text-gray-600">
              No conditions added yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {disabilities.map((d) => (
                <li key={d.id} className="text-sm">
                  <span className="font-medium">{d.name}</span> -{" "}
                  {d.category}
                  {d.serviceConnected && (
                    <span className="ml-2 text-green-600 text-xs">
                      Service-Connected
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Supporting Evidence Summary */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Supporting Evidence</h4>
          <div className="text-sm">
            {supportingEvidence.evidenceTypes.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {supportingEvidence.evidenceTypes.map((type) => (
                  <li key={type}>{type}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No evidence types selected.</p>
            )}
          </div>
        </div>

        {isSubmitted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              Claim submitted successfully!
            </p>
            <p className="text-green-700 text-sm mt-1">
              Your claim has been saved. You can view it in your dashboard.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderMilitaryService();
      case 2:
        return renderDisabilities();
      case 3:
        return renderSupportingEvidence();
      case 4:
        return renderReview();
      default:
        return renderPersonalInfo();
    }
  };

  // Introduction section rendered before the step content
  const renderIntroduction = () => {
    const { militaryService } = claimData;
    const hasBranch = militaryService.branch;
    const hasServicePeriod =
      militaryService.entryDate && militaryService.separationDate;
    const disabilityCount = claimData.disabilities.length;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-base font-semibold text-blue-900 mb-1">
          VA Disability Claim Builder
        </h2>
        {hasBranch || disabilityCount > 0 ? (
          <p className="text-sm text-blue-800">
            Building claim for{" "}
            {hasBranch ? (
              <span className="font-medium">{militaryService.branch}</span>
            ) : (
              "your service"
            )}
            {hasServicePeriod
              ? ` (${militaryService.entryDate} – ${militaryService.separationDate})`
              : ""}
            {disabilityCount > 0
              ? ` • ${disabilityCount} condition${
                  disabilityCount !== 1 ? "s" : ""
                } added`
              : ""}
            .
          </p>
        ) : (
          <p className="text-sm text-blue-800">
            This guided tool helps you build a complete VA disability claim
            step-by-step. Your information is saved as you go.
          </p>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard">
              <button className="text-blue-600 hover:text-blue-700 text-sm">
                ← Dashboard
              </button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            VA Disability Claim Builder
          </h1>
          <p className="text-gray-600 mt-1">
            Complete each section to build your disability claim
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="mb-8">
          <ProgressTracker
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
          />
        </div>

        {/* Intro Banner */}
        {renderIntroduction()}

        {/* Main Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {renderCurrentStep()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending || isSubmitted}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitMutation.isPending
                  ? "Submitting..."
                  : isSubmitted
                  ? "Submitted"
                  : "Submit Claim"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Your Claim?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this claim? Please ensure all
              information is accurate before submitting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSubmit}
              disabled={submitMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitMutation.isPending ? "Submitting..." : "Confirm Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
