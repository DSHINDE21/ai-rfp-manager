import { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Heading,
  Card,
  CardBody,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Text,
  HStack,
  useToast,
} from "@chakra-ui/react";
import { rfpApi, proposalApi, emailApi } from "../services/api";

const Proposals = () => {
  const [rfps, setRfps] = useState([]);
  const [selectedRfpId, setSelectedRfpId] = useState("");
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingEmails, setCheckingEmails] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProposal, setSelectedProposal] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchRFPs();
  }, []);

  useEffect(() => {
    if (selectedRfpId) {
      fetchProposals();
    }
  }, [selectedRfpId]);

  const fetchRFPs = async () => {
    try {
      const response = await rfpApi.getAll();
      const rfpsList = response?.data?.data || response?.data || [];
      const rfpsArray = Array.isArray(rfpsList) ? rfpsList : [];
      setRfps(rfpsArray);
      if (rfpsArray.length > 0) {
        setSelectedRfpId(rfpsArray[0]?._id);
      }
    } catch (error) {
      console.error("Error fetching RFPs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async () => {
    try {
      const response = await proposalApi.getByRFP(selectedRfpId);
      const proposalsList = response?.data?.data || response?.data || [];
      setProposals(Array.isArray(proposalsList) ? proposalsList : []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setProposals([]);
    }
  };

  const handleViewDetails = (proposal) => {
    setSelectedProposal(proposal);
    onOpen();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "parsed":
        return "green";
      case "pending":
        return "yellow";
      case "error":
        return "red";
      default:
        return "gray";
    }
  };

  const handleCheckProposals = async () => {
    setCheckingEmails(true);
    try {
      const response = await emailApi.checkInbox();
      const result = response.data.data || response.data;
      const processedCount = result.processed || 0;
      const emails = result.emails || [];

      if (processedCount > 0) {
        if (selectedRfpId) {
          fetchProposals();
        }

        const successEmails = emails.filter((e) => e.success);
        const details = successEmails
          .map((e) => {
            const price = e.extractedData?.totalPrice
              ? ` - $${e.extractedData.totalPrice.toLocaleString()}`
              : "";
            return `• ${e.vendorName || e.vendorEmail}${price}`;
          })
          .join("\n");

        toast({
          title: `Found ${processedCount} new proposal(s)!`,
          description:
            details || "Proposals have been processed and parsed by AI.",
          status: "success",
          duration: 6000,
          isClosable: true,
        });
      } else {
        toast({
          title: "No new proposals",
          description: result.message || "No new emails from vendors found.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error checking emails",
        description:
          error.response?.data?.message || "Failed to check vendor emails.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCheckingEmails(false);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between" align="center">
        <Heading size="lg">Proposals</Heading>
        <Button
          colorScheme="teal"
          onClick={handleCheckProposals}
          isLoading={checkingEmails}
          loadingText="Checking..."
        >
          Check Proposals
        </Button>
      </HStack>

      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Select
                value={selectedRfpId}
                onChange={(e) => setSelectedRfpId(e.target.value)}
                placeholder="Select an RFP"
              >
                {rfps.map((rfp) => (
                  <option key={rfp._id} value={rfp._id}>
                    {rfp.title}
                  </option>
                ))}
              </Select>
            </Box>

            {selectedRfpId && (
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Vendor</Th>
                      <Th isNumeric>Proposal #</Th>
                      <Th>Total Price</Th>
                      <Th>Status</Th>
                      <Th>Received</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {proposals.length === 0 ? (
                      <Tr>
                        <Td colSpan={6} textAlign="center" py={8}>
                          <Text color="gray.500">
                            No proposals received yet
                          </Text>
                        </Td>
                      </Tr>
                    ) : (
                      proposals.map((proposal) => (
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
                              colorScheme={getStatusColor(proposal.status)}
                            >
                              {proposal.status}
                            </Badge>
                          </Td>
                          <Td>
                            {new Date(proposal.receivedAt).toLocaleDateString()}
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              onClick={() => handleViewDetails(proposal)}
                            >
                              View Details
                            </Button>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </VStack>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Proposal Details
            {selectedProposal && (
              <Badge colorScheme="blue" ml={2}>
                #{selectedProposal.proposalNumber || 1}
              </Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProposal && (
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Box flex={1}>
                    <Text fontWeight="bold">Vendor:</Text>
                    <Text>{selectedProposal.vendorId?.name || "Unknown"}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Proposal #:</Text>
                    <Badge colorScheme="blue" fontSize="md">
                      #{selectedProposal.proposalNumber || 1}
                    </Badge>
                  </Box>
                </HStack>
                <Box>
                  <Text fontWeight="bold">Status:</Text>
                  <Badge colorScheme={getStatusColor(selectedProposal.status)}>
                    {selectedProposal.status}
                  </Badge>
                </Box>
                {selectedProposal.extractedData && (
                  <Box>
                    <Text fontWeight="bold">Extracted Data:</Text>
                    <Box
                      p={4}
                      bg="gray.50"
                      borderRadius="md"
                      mt={2}
                      maxH="400px"
                      overflowY="auto"
                    >
                      <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px" }}>
                        {JSON.stringify(
                          selectedProposal.extractedData,
                          null,
                          2
                        )}
                      </pre>
                    </Box>
                  </Box>
                )}
                <Box>
                  <Text fontWeight="bold">Raw Email Content:</Text>
                  <Box
                    p={4}
                    bg="gray.50"
                    borderRadius="md"
                    mt={2}
                    maxH="200px"
                    overflowY="auto"
                  >
                    <Text fontSize="sm" whiteSpace="pre-wrap">
                      {typeof selectedProposal.emailContent === "object"
                        ? selectedProposal.emailContent?.body ||
                          selectedProposal.emailContent?.text ||
                          JSON.stringify(selectedProposal.emailContent, null, 2)
                        : selectedProposal.emailContent || "No content"}
                    </Text>
                  </Box>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default Proposals;
