import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import * as yup from "yup";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Checkbox,
  CheckboxGroup,
  Alert,
  AlertIcon,
  Spinner,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  Textarea,
} from "@chakra-ui/react";
import { rfpApi, vendorApi, proposalApi, emailApi } from "../services/api";

// Validation schema for manual proposal
const proposalSchema = yup.object({
  vendorId: yup.string().required("Please select a vendor"),
  content: yup
    .string()
    .required("Proposal content is required")
    .min(
      50,
      "Proposal must be at least 50 characters for AI to extract meaningful data"
    )
    .max(10000, "Proposal must be less than 10000 characters"),
});

const RFPDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isProposalOpen,
    onOpen: onProposalOpen,
    onClose: onProposalClose,
  } = useDisclosure();

  const [rfp, setRfp] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Manual proposal form state
  const [manualProposal, setManualProposal] = useState({
    vendorId: "",
    content: "",
  });
  const [proposalErrors, setProposalErrors] = useState({});
  const [proposalTouched, setProposalTouched] = useState({});
  const [parsingProposal, setParsingProposal] = useState(false);
  const [checkingEmails, setCheckingEmails] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  // Auto-dismiss messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchData = async () => {
    try {
      const [rfpRes, vendorsRes, proposalsRes] = await Promise.all([
        rfpApi.getById(id),
        vendorApi.getAll(),
        proposalApi.getByRFP(id).catch(() => ({ data: { data: [] } })),
      ]);
      setRfp(rfpRes?.data?.data || rfpRes?.data);
      
      const vendorsList = vendorsRes?.data?.data || vendorsRes?.data || [];
      setVendors(Array.isArray(vendorsList) ? vendorsList : []);
      
      const proposalsList = proposalsRes?.data?.data || proposalsRes?.data || [];
      setProposals(Array.isArray(proposalsList) ? proposalsList : []);
    } catch (err) {
      setError("Failed to load RFP details");
    } finally {
      setLoading(false);
    }
  };

  const validateProposalField = useCallback(
    async (field, value) => {
      try {
        await proposalSchema.validateAt(field, {
          ...manualProposal,
          [field]: value,
        });
        setProposalErrors((prev) => ({ ...prev, [field]: "" }));
      } catch (err) {
        setProposalErrors((prev) => ({ ...prev, [field]: err.message }));
      }
    },
    [manualProposal]
  );

  const validateProposalForm = async () => {
    try {
      await proposalSchema.validate(manualProposal, { abortEarly: false });
      setProposalErrors({});
      return true;
    } catch (err) {
      const newErrors = {};
      err.inner.forEach((e) => {
        newErrors[e.path] = e.message;
      });
      setProposalErrors(newErrors);
      setProposalTouched({ vendorId: true, content: true });
      return false;
    }
  };

  const handleProposalFieldChange = (field, value) => {
    setManualProposal((prev) => ({ ...prev, [field]: value }));
    if (proposalTouched[field]) {
      validateProposalField(field, value);
    }
  };

  const handleProposalFieldBlur = (field) => {
    setProposalTouched((prev) => ({ ...prev, [field]: true }));
    validateProposalField(field, manualProposal[field]);
  };

  const handleSendToVendors = async () => {
    if (selectedVendors.length === 0) {
      setError("Please select at least one vendor");
      return;
    }

    setSending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await rfpApi.sendToVendors(id, selectedVendors);
      const result = response.data.data || response.data;

      const successCount = result.successCount || 0;
      const failedCount = result.failedCount || 0;

      if (failedCount > 0 && successCount > 0) {
        setSuccessMessage(
          `RFP sent to ${successCount} vendor(s). ${failedCount} failed.`
        );
      } else {
        setSuccessMessage(
          `RFP sent successfully to ${successCount} vendor(s)!`
        );
      }
      onClose();
      setSelectedVendors([]);
      fetchData();
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = errorData?.message || "Failed to send RFP";

      if (errorMessage.includes("Username and Password not accepted")) {
        errorMessage =
          "Email authentication failed. Please check SMTP credentials in server configuration.";
      } else if (errorMessage.includes("Invalid login")) {
        errorMessage = "Email login failed. Please verify email settings.";
      }

      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleManualProposalSubmit = async () => {
    const isValid = await validateProposalForm();
    if (!isValid) return;

    setParsingProposal(true);
    setError(null);
    try {
      await proposalApi.parse({
        rfpId: id,
        vendorId: manualProposal.vendorId,
        content: manualProposal.content,
      });
      setSuccessMessage("Proposal added and parsed successfully!");
      onProposalClose();
      setManualProposal({ vendorId: "", content: "" });
      setProposalErrors({});
      setProposalTouched({});
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to parse proposal");
    } finally {
      setParsingProposal(false);
    }
  };

  const handleProposalModalClose = () => {
    onProposalClose();
    setManualProposal({ vendorId: "", content: "" });
    setProposalErrors({});
    setProposalTouched({});
  };

  const handleCheckProposals = async () => {
    setCheckingEmails(true);
    setError(null);
    try {
      const response = await emailApi.checkInbox();
      const result = response.data.data || response.data;
      const processedCount = result.processed || 0;
      const emails = result.emails || [];

      if (processedCount > 0) {
        // Filter emails for this RFP
        const relevantEmails = emails.filter(
          (e) => e.success && e.rfpId === rfp?.rfpId
        );

        if (relevantEmails.length > 0) {
          // Build detailed message with AI-extracted data
          const details = relevantEmails
            .map((e) => {
              const price = e.extractedData?.totalPrice
                ? ` ($${e.extractedData.totalPrice.toLocaleString()})`
                : "";
              return `${e.vendorName || e.vendorEmail}${price}`;
            })
            .join(", ");

          setSuccessMessage(
            `Found ${relevantEmails.length} new proposal(s) - AI extracted: ${details}`
          );
        } else {
          setSuccessMessage(
            `Found ${processedCount} proposal(s), but none for this RFP.`
          );
        }
        fetchData(); // Refresh the proposals list
      } else {
        setSuccessMessage(
          result.message || "No new proposals found from vendors."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to check emails for proposals"
      );
    } finally {
      setCheckingEmails(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "sent":
        return "blue";
      case "closed":
        return "green";
      case "draft":
        return "gray";
      case "cancelled":
        return "red";
      default:
        return "gray";
    }
  };

  const isProposalFormValid =
    manualProposal.vendorId &&
    manualProposal.content.length >= 50 &&
    !proposalErrors.vendorId &&
    !proposalErrors.content;

  if (loading) {
    return (
      <VStack spacing={4} py={10}>
        <Spinner size="xl" />
        <Text>Loading RFP details...</Text>
      </VStack>
    );
  }

  if (!rfp) {
    return (
      <Alert status="error">
        <AlertIcon />
        RFP not found
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" align="start" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg">{rfp.title}</Heading>
          <HStack mt={2}>
            <Badge colorScheme={getStatusColor(rfp.status)} fontSize="sm">
              {rfp.status?.toUpperCase()}
            </Badge>
            <Text color="gray.500" fontSize="sm">
              ID: {rfp.rfpId}
            </Text>
          </HStack>
        </Box>
        <HStack>
          <Button onClick={onOpen} colorScheme="blue">
            Send to Vendors
          </Button>
          <Button onClick={onProposalOpen} colorScheme="green">
            Add Proposal
          </Button>
          <Button as={RouterLink} to={`/comparison/${id}`} colorScheme="purple">
            View Comparison
          </Button>
        </HStack>
      </HStack>

      {/* Messages */}
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert status="success">
          <AlertIcon />
          {successMessage}
        </Alert>
      )}

      {/* RFP Details */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <Stat>
          <StatLabel>Budget</StatLabel>
          <StatNumber>${rfp.budget?.toLocaleString() || "N/A"}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Timeline</StatLabel>
          <StatNumber fontSize="lg">{rfp.timeline || "N/A"}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Payment Terms</StatLabel>
          <StatNumber fontSize="lg">{rfp.paymentTerms || "N/A"}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Warranty</StatLabel>
          <StatNumber fontSize="lg">{rfp.warranty || "N/A"}</StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Description */}
      <Card>
        <CardHeader>
          <Heading size="md">Description</Heading>
        </CardHeader>
        <CardBody pt={0}>
          <Text whiteSpace="pre-wrap">{rfp.description}</Text>
        </CardBody>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <Heading size="md">Required Items</Heading>
        </CardHeader>
        <CardBody pt={0}>
          {rfp.items?.length > 0 ? (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>#</Th>
                    <Th>Item</Th>
                    <Th isNumeric>Quantity</Th>
                    <Th>Specifications</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rfp.items.map((item, idx) => (
                    <Tr key={idx}>
                      <Td>{idx + 1}</Td>
                      <Td>{item.name}</Td>
                      <Td isNumeric>{item.quantity}</Td>
                      <Td>{item.specifications || "-"}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <Text color="gray.500">No items specified</Text>
          )}
        </CardBody>
      </Card>

      {/* Proposals Received */}
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">Proposals Received ({proposals.length})</Heading>
            <Button
              colorScheme="teal"
              size="sm"
              onClick={handleCheckProposals}
              isLoading={checkingEmails}
              loadingText="Checking..."
            >
              Check Proposals
            </Button>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          {proposals.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={4}>
              No proposals received yet. Send this RFP to vendors or add a
              manual proposal for demo.
            </Text>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Vendor</Th>
                    <Th isNumeric>Proposal #</Th>
                    <Th>Total Price</Th>
                    <Th>Status</Th>
                    <Th>Received</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {proposals.map((proposal) => (
                    <Tr key={proposal._id}>
                      <Td>{proposal.vendorId?.name || "Unknown"}</Td>
                      <Td isNumeric>
                        <Badge colorScheme="blue" variant="subtle">
                          #{proposal.proposalNumber || 1}
                        </Badge>
                      </Td>
                      <Td>
                        {proposal.extractedData?.totalPrice
                          ? `$${proposal.extractedData.totalPrice.toLocaleString()}`
                          : "-"}
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={
                            proposal.status === "parsed" ? "green" : "yellow"
                          }
                        >
                          {proposal.status}
                        </Badge>
                      </Td>
                      <Td>
                        {new Date(
                          proposal.receivedAt || proposal.createdAt
                        ).toLocaleDateString()}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Send to Vendors Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send RFP to Vendors</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {vendors.length === 0 ? (
              <Alert status="warning">
                <AlertIcon />
                No vendors found. Please add vendors first.
              </Alert>
            ) : (
              <VStack align="stretch" spacing={4}>
                <Text>Select vendors to send this RFP to:</Text>
                <CheckboxGroup
                  value={selectedVendors}
                  onChange={setSelectedVendors}
                >
                  <VStack align="stretch" spacing={2}>
                    {vendors.map((vendor) => (
                      <Checkbox key={vendor._id} value={vendor._id}>
                        <Box>
                          <Text fontWeight="medium">{vendor.name}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {vendor.email}
                          </Text>
                        </Box>
                      </Checkbox>
                    ))}
                  </VStack>
                </CheckboxGroup>
                {selectedVendors.length === 0 && (
                  <Text color="orange.500" fontSize="sm">
                    Please select at least one vendor
                  </Text>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSendToVendors}
              isLoading={sending}
              loadingText="Sending..."
              isDisabled={vendors.length === 0 || selectedVendors.length === 0}
            >
              Send RFP ({selectedVendors.length} selected)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Manual Proposal Modal */}
      <Modal
        isOpen={isProposalOpen}
        onClose={handleProposalModalClose}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Manual Proposal (Demo)</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                This allows you to simulate a vendor response for demo purposes.
                The AI will parse the content and extract structured data.
              </Text>

              <FormControl
                isInvalid={
                  proposalTouched.vendorId && !!proposalErrors.vendorId
                }
                isRequired
              >
                <FormLabel>Select Vendor</FormLabel>
                <Select
                  placeholder="Select a vendor..."
                  value={manualProposal.vendorId}
                  onChange={(e) =>
                    handleProposalFieldChange("vendorId", e.target.value)
                  }
                  onBlur={() => handleProposalFieldBlur("vendorId")}
                >
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name} ({vendor.email})
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{proposalErrors.vendorId}</FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={proposalTouched.content && !!proposalErrors.content}
                isRequired
              >
                <FormLabel>Proposal Content</FormLabel>
                <Textarea
                  placeholder={`Example vendor response:

Dear Procurement Team,

Thank you for the RFP. Here is our proposal:

Laptops (20 units): $1,200 each = $24,000
Monitors (15 units): $400 each = $6,000

Total Price: $30,000
Delivery: 25 days
Payment Terms: Net 30
Warranty: 2 years

Best regards,
Vendor Name`}
                  value={manualProposal.content}
                  onChange={(e) =>
                    handleProposalFieldChange("content", e.target.value)
                  }
                  onBlur={() => handleProposalFieldBlur("content")}
                  rows={10}
                />
                <FormErrorMessage>{proposalErrors.content}</FormErrorMessage>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {manualProposal.content.length}/10000 characters (minimum 50)
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleProposalModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleManualProposalSubmit}
              isLoading={parsingProposal}
              loadingText="Parsing with AI..."
              isDisabled={!isProposalFormValid}
            >
              Add & Parse Proposal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default RFPDetail;
