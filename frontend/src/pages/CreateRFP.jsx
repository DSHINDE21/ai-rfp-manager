import { useState, useEffect, useCallback } from "react";
import * as yup from "yup";
import {
  Box,
  VStack,
  Heading,
  Textarea,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  NumberInput,
  NumberInputField,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Alert,
  AlertIcon,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { rfpApi } from "../services/api";

// Validation schema for natural language input
const naturalLanguageSchema = yup.object({
  naturalLanguage: yup
    .string()
    .required("Please describe your procurement needs")
    .min(
      20,
      "Description must be at least 20 characters for AI to extract details"
    )
    .max(5000, "Description must be less than 5000 characters"),
});

// Validation schema for RFP form (after extraction)
const rfpSchema = yup.object({
  title: yup
    .string()
    .required("Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: yup
    .string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters"),
  budget: yup
    .number()
    .required("Budget is required")
    .min(1, "Budget must be greater than 0")
    .typeError("Budget must be a number"),
  timeline: yup.string().required("Timeline is required"),
  paymentTerms: yup
    .string()
    .max(200, "Payment terms must be less than 200 characters"),
  warranty: yup.string().max(200, "Warranty must be less than 200 characters"),
});

const CreateRFP = () => {
  const navigate = useNavigate();
  const [naturalLanguage, setNaturalLanguage] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [rfpData, setRfpData] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Validation states
  const [nlErrors, setNlErrors] = useState({});
  const [nlTouched, setNlTouched] = useState(false);
  const [rfpErrors, setRfpErrors] = useState({});
  const [rfpTouched, setRfpTouched] = useState({});

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const validateNaturalLanguage = useCallback(async (value) => {
    try {
      await naturalLanguageSchema.validate({ naturalLanguage: value });
      setNlErrors({});
      return true;
    } catch (err) {
      setNlErrors({ naturalLanguage: err.message });
      return false;
    }
  }, []);

  const validateRfpField = useCallback(
    async (field, value) => {
      try {
        await rfpSchema.validateAt(field, { ...rfpData, [field]: value });
        setRfpErrors((prev) => ({ ...prev, [field]: "" }));
      } catch (err) {
        setRfpErrors((prev) => ({ ...prev, [field]: err.message }));
      }
    },
    [rfpData]
  );

  const validateRfpForm = async () => {
    try {
      await rfpSchema.validate(rfpData, { abortEarly: false });
      setRfpErrors({});
      return true;
    } catch (err) {
      const newErrors = {};
      err.inner.forEach((e) => {
        newErrors[e.path] = e.message;
      });
      setRfpErrors(newErrors);
      setRfpTouched({
        title: true,
        description: true,
        budget: true,
        timeline: true,
        paymentTerms: true,
        warranty: true,
      });
      return false;
    }
  };

  const handleNaturalLanguageChange = (value) => {
    setNaturalLanguage(value);
    if (nlTouched) {
      validateNaturalLanguage(value);
    }
  };

  const handleNaturalLanguageBlur = () => {
    setNlTouched(true);
    validateNaturalLanguage(naturalLanguage);
  };

  const handleExtract = async () => {
    const isValid = await validateNaturalLanguage(naturalLanguage);
    setNlTouched(true);

    if (!isValid) return;

    setExtracting(true);
    setError(null);

    try {
      const extractResponse = await rfpApi.create({
        naturalLanguage,
      });
      const rfp = extractResponse.data.data || extractResponse.data;
      setRfpData(rfp);
      setRfpErrors({});
      setRfpTouched({});
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to extract RFP data. Please try again."
      );
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!rfpData) return;

    const isValid = await validateRfpForm();
    if (!isValid) return;

    setSaving(true);
    try {
      if (rfpData._id) {
        await rfpApi.update(rfpData._id, {
          title: rfpData.title,
          description: rfpData.description,
          items: rfpData.items,
          budget: rfpData.budget,
          timeline: rfpData.timeline,
          paymentTerms: rfpData.paymentTerms,
          warranty: rfpData.warranty,
        });
      } else {
        await rfpApi.create(rfpData);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save RFP");
    } finally {
      setSaving(false);
    }
  };

  const updateRfpField = (field, value) => {
    setRfpData((prev) => ({ ...prev, [field]: value }));
    if (rfpTouched[field]) {
      validateRfpField(field, value);
    }
  };

  const handleRfpFieldBlur = (field) => {
    setRfpTouched((prev) => ({ ...prev, [field]: true }));
    validateRfpField(field, rfpData[field]);
  };

  const isNlValid = naturalLanguage.trim().length >= 20;
  const isRfpValid =
    rfpData &&
    rfpData.title?.trim() &&
    rfpData.description?.trim() &&
    rfpData.budget > 0 &&
    rfpData.timeline?.trim() &&
    !rfpErrors.title &&
    !rfpErrors.description &&
    !rfpErrors.budget &&
    !rfpErrors.timeline;

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">Create RFP</Heading>

      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl isInvalid={nlTouched && !!nlErrors.naturalLanguage}>
              <FormLabel>
                Describe your procurement needs (Natural Language)
                <Text as="span" color="red.500" ml={1}>
                  *
                </Text>
              </FormLabel>
              <Textarea
                value={naturalLanguage}
                onChange={(e) => handleNaturalLanguageChange(e.target.value)}
                onBlur={handleNaturalLanguageBlur}
                placeholder="Example: I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty."
                rows={6}
              />
              <FormErrorMessage>{nlErrors.naturalLanguage}</FormErrorMessage>
              <Text fontSize="sm" color="gray.500" mt={1}>
                {naturalLanguage.length}/5000 characters (minimum 20)
              </Text>
            </FormControl>
            <Button
              onClick={handleExtract}
              colorScheme="blue"
              isLoading={extracting}
              loadingText="Extracting..."
              isDisabled={!isNlValid}
            >
              Extract RFP Details
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {extracting && (
        <Card>
          <CardBody>
            <HStack justify="center">
              <Spinner size="lg" />
              <Text>AI is extracting RFP details...</Text>
            </HStack>
          </CardBody>
        </Card>
      )}

      {rfpData && (
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Structured RFP Details</Heading>

              <FormControl
                isInvalid={rfpTouched.title && !!rfpErrors.title}
                isRequired
              >
                <FormLabel>Title</FormLabel>
                <Input
                  value={rfpData.title || ""}
                  onChange={(e) => updateRfpField("title", e.target.value)}
                  onBlur={() => handleRfpFieldBlur("title")}
                />
                <FormErrorMessage>{rfpErrors.title}</FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={rfpTouched.description && !!rfpErrors.description}
                isRequired
              >
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={rfpData.description || ""}
                  onChange={(e) =>
                    updateRfpField("description", e.target.value)
                  }
                  onBlur={() => handleRfpFieldBlur("description")}
                  rows={4}
                />
                <FormErrorMessage>{rfpErrors.description}</FormErrorMessage>
              </FormControl>

              <HStack align="start">
                <FormControl
                  isInvalid={rfpTouched.budget && !!rfpErrors.budget}
                  isRequired
                >
                  <FormLabel>Budget ($)</FormLabel>
                  <NumberInput
                    value={rfpData.budget || 0}
                    min={1}
                    onChange={(_, value) =>
                      updateRfpField("budget", value || 0)
                    }
                    onBlur={() => handleRfpFieldBlur("budget")}
                  >
                    <NumberInputField />
                  </NumberInput>
                  <FormErrorMessage>{rfpErrors.budget}</FormErrorMessage>
                </FormControl>

                <FormControl
                  isInvalid={rfpTouched.timeline && !!rfpErrors.timeline}
                  isRequired
                >
                  <FormLabel>Timeline</FormLabel>
                  <Input
                    value={rfpData.timeline || ""}
                    onChange={(e) => updateRfpField("timeline", e.target.value)}
                    onBlur={() => handleRfpFieldBlur("timeline")}
                    placeholder="e.g., 30 days"
                  />
                  <FormErrorMessage>{rfpErrors.timeline}</FormErrorMessage>
                </FormControl>
              </HStack>

              <FormControl
                isInvalid={rfpTouched.paymentTerms && !!rfpErrors.paymentTerms}
              >
                <FormLabel>Payment Terms</FormLabel>
                <Input
                  value={rfpData.paymentTerms || ""}
                  onChange={(e) =>
                    updateRfpField("paymentTerms", e.target.value)
                  }
                  onBlur={() => handleRfpFieldBlur("paymentTerms")}
                  placeholder="e.g., Net 30"
                />
                <FormErrorMessage>{rfpErrors.paymentTerms}</FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={rfpTouched.warranty && !!rfpErrors.warranty}
              >
                <FormLabel>Warranty</FormLabel>
                <Input
                  value={rfpData.warranty || ""}
                  onChange={(e) => updateRfpField("warranty", e.target.value)}
                  onBlur={() => handleRfpFieldBlur("warranty")}
                  placeholder="e.g., 1 year"
                />
                <FormErrorMessage>{rfpErrors.warranty}</FormErrorMessage>
              </FormControl>

              {rfpData.items && rfpData.items.length > 0 && (
                <Box>
                  <FormLabel mb={2}>Items</FormLabel>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Item</Th>
                          <Th>Quantity</Th>
                          <Th>Specifications</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {rfpData.items.map((item, idx) => (
                          <Tr key={idx}>
                            <Td>{item.name}</Td>
                            <Td>{item.quantity}</Td>
                            <Td>{item.specifications || "-"}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              <Button
                onClick={handleSave}
                colorScheme="green"
                size="lg"
                isLoading={saving}
                loadingText="Saving..."
                isDisabled={!isRfpValid}
              >
                {rfpData._id ? "Update RFP" : "Save RFP"}
              </Button>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default CreateRFP;
