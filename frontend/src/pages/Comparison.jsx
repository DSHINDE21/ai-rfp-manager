import { useState, useEffect } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Card,
  CardBody,
  CardHeader,
  Button,
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
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  Divider,
} from "@chakra-ui/react";
import { rfpApi, comparisonApi, proposalApi } from "../services/api";

const Comparison = () => {
  const { rfpId } = useParams();
  const [rfp, setRfp] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [rfpId]);

  const fetchData = async () => {
    try {
      const [rfpRes, comparisonRes, proposalsRes] = await Promise.all([
        rfpApi.getById(rfpId),
        comparisonApi.getByRFP(rfpId).catch(() => null),
        proposalApi.getByRFP(rfpId).catch(() => ({ data: { data: [] } })),
      ]);
      setRfp(rfpRes?.data?.data || rfpRes?.data);
      setComparison(comparisonRes?.data?.data || null);
      const proposalsList = proposalsRes?.data?.data || proposalsRes?.data || [];
      setProposals(Array.isArray(proposalsList) ? proposalsList : []);
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateComparison = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await comparisonApi.generate(rfpId);
      setComparison(response.data.data || response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate comparison");
    } finally {
      setGenerating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    return "red";
  };

  const getScoreProgressColor = (score) => {
    if (score >= 80) return "green.500";
    if (score >= 60) return "yellow.500";
    return "red.500";
  };

  if (loading) {
    return (
      <VStack spacing={4} py={10}>
        <Spinner size="xl" />
        <Text>Loading...</Text>
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

  // Get scores mapped to proposals
  const getProposalScore = (proposalId) => {
    if (!comparison?.scores) return null;
    return comparison.scores.find(
      (s) => s.proposalId?._id === proposalId || s.proposalId === proposalId
    );
  };

  // Get recommended proposal
  const recommendedProposalId =
    comparison?.aiRecommendation?.proposalId?._id ||
    comparison?.aiRecommendation?.proposalId;

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg">Comparison: {rfp.title}</Heading>
          <Text color="gray.500" fontSize="sm">
            {proposals.length} proposal(s) received
          </Text>
        </Box>
        <HStack>
          <Button as={RouterLink} to={`/rfps/${rfpId}`} variant="outline">
            Back to RFP
          </Button>
          <Button
            onClick={handleGenerateComparison}
            colorScheme="blue"
            isLoading={generating}
            loadingText="Generating..."
            isDisabled={proposals.length === 0}
          >
            {comparison ? "Regenerate AI Comparison" : "Generate AI Comparison"}
          </Button>
        </HStack>
      </HStack>

      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {proposals.length === 0 ? (
        <Card>
          <CardBody>
            <VStack py={8}>
              <Text color="gray.500" textAlign="center">
                No proposals received yet for this RFP.
              </Text>
              <Text color="gray.500" fontSize="sm">
                Send the RFP to vendors or add manual proposals to compare.
              </Text>
              <Button
                as={RouterLink}
                to={`/rfps/${rfpId}`}
                colorScheme="blue"
                mt={4}
              >
                Go to RFP Details
              </Button>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* RFP Summary */}
          <Card>
            <CardHeader>
              <Heading size="md">RFP Requirements</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <Stat>
                  <StatLabel>Budget</StatLabel>
                  <StatNumber fontSize="lg">
                    ${rfp.budget?.toLocaleString()}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Timeline</StatLabel>
                  <StatNumber fontSize="lg">{rfp.timeline}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Payment Terms</StatLabel>
                  <StatNumber fontSize="lg">{rfp.paymentTerms}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Warranty</StatLabel>
                  <StatNumber fontSize="lg">{rfp.warranty}</StatNumber>
                </Stat>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* AI Recommendation */}
          {comparison?.aiRecommendation && (
            <Card bg="green.50" borderColor="green.200" borderWidth={2}>
              <CardHeader>
                <HStack>
                  <Heading size="md" color="green.700">
                    🏆 AI Recommendation
                  </Heading>
                  <Badge colorScheme="green" fontSize="sm">
                    {comparison.aiRecommendation.confidence}% Confidence
                  </Badge>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="stretch" spacing={3}>
                  <Text fontWeight="bold" fontSize="lg" color="green.800">
                    Recommended Vendor:{" "}
                    {comparison.aiRecommendation.vendorId?.name || "Unknown"}
                  </Text>
                  <Text color="green.700">
                    {comparison.aiRecommendation.reasoning}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* AI Summary */}
          {comparison?.aiSummary && (
            <Card>
              <CardHeader>
                <Heading size="md">AI Analysis Summary</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <Text whiteSpace="pre-wrap">{comparison.aiSummary}</Text>
              </CardBody>
            </Card>
          )}

          {/* Proposals Comparison Table */}
          <Card>
            <CardHeader>
              <Heading size="md">Proposal Comparison</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Vendor</Th>
                      <Th isNumeric>Total Price</Th>
                      <Th>Delivery</Th>
                      <Th>Payment Terms</Th>
                      <Th>Warranty</Th>
                      {comparison && <Th isNumeric>Score</Th>}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {proposals.map((proposal) => {
                      const score = getProposalScore(proposal._id);
                      const isRecommended =
                        proposal._id === recommendedProposalId;

                      return (
                        <Tr
                          key={proposal._id}
                          bg={isRecommended ? "green.50" : undefined}
                        >
                          <Td>
                            <HStack>
                              <Text fontWeight="medium">
                                {proposal.vendorId?.name || "Unknown"}
                              </Text>
                              <Badge
                                colorScheme="blue"
                                variant="subtle"
                                fontSize="xs"
                              >
                                #{proposal.proposalNumber || 1}
                              </Badge>
                              {isRecommended && (
                                <Badge colorScheme="green" fontSize="xs">
                                  Recommended
                                </Badge>
                              )}
                            </HStack>
                          </Td>
                          <Td isNumeric fontWeight="bold">
                            {proposal.extractedData?.totalPrice
                              ? `$${proposal.extractedData.totalPrice.toLocaleString()}`
                              : "-"}
                          </Td>
                          <Td>
                            {proposal.extractedData?.deliveryTerms || "N/A"}
                          </Td>
                          <Td>
                            {proposal.extractedData?.paymentTerms || "N/A"}
                          </Td>
                          <Td>{proposal.extractedData?.warranty || "N/A"}</Td>
                          {comparison && (
                            <Td isNumeric>
                              {score ? (
                                <Badge
                                  colorScheme={getScoreColor(
                                    score.overallScore
                                  )}
                                  fontSize="md"
                                  px={3}
                                  py={1}
                                >
                                  {score.overallScore}%
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </Td>
                          )}
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>

          {/* Detailed Scores */}
          {comparison?.scores && comparison.scores.length > 0 && (
            <Card>
              <CardHeader>
                <Heading size="md">Detailed Scoring</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {comparison.scores.map((score) => {
                    const proposal = proposals.find(
                      (p) =>
                        p._id === score.proposalId?._id ||
                        p._id === score.proposalId
                    );
                    const vendorName =
                      score.vendorId?.name ||
                      proposal?.vendorId?.name ||
                      "Unknown";
                    const isRecommended =
                      score.proposalId?._id === recommendedProposalId ||
                      score.proposalId === recommendedProposalId;

                    return (
                      <Card
                        key={score.proposalId?._id || score.proposalId}
                        variant="outline"
                        borderColor={isRecommended ? "green.400" : undefined}
                        borderWidth={isRecommended ? 2 : 1}
                      >
                        <CardBody>
                          <HStack justify="space-between" mb={4}>
                            <Heading size="sm">{vendorName}</Heading>
                            <Badge
                              colorScheme={getScoreColor(score.overallScore)}
                              fontSize="lg"
                            >
                              {score.overallScore}%
                            </Badge>
                          </HStack>

                          <VStack spacing={3} align="stretch">
                            <Box>
                              <HStack justify="space-between" mb={1}>
                                <Text fontSize="sm">Price Score</Text>
                                <Text fontSize="sm" fontWeight="bold">
                                  {score.priceScore}%
                                </Text>
                              </HStack>
                              <Progress
                                value={score.priceScore}
                                size="sm"
                                colorScheme={getScoreColor(score.priceScore)}
                                borderRadius="full"
                              />
                            </Box>

                            <Box>
                              <HStack justify="space-between" mb={1}>
                                <Text fontSize="sm">Compliance Score</Text>
                                <Text fontSize="sm" fontWeight="bold">
                                  {score.complianceScore}%
                                </Text>
                              </HStack>
                              <Progress
                                value={score.complianceScore}
                                size="sm"
                                colorScheme={getScoreColor(
                                  score.complianceScore
                                )}
                                borderRadius="full"
                              />
                            </Box>

                            <Box>
                              <HStack justify="space-between" mb={1}>
                                <Text fontSize="sm">Terms Score</Text>
                                <Text fontSize="sm" fontWeight="bold">
                                  {score.termsScore}%
                                </Text>
                              </HStack>
                              <Progress
                                value={score.termsScore}
                                size="sm"
                                colorScheme={getScoreColor(score.termsScore)}
                                borderRadius="full"
                              />
                            </Box>

                            <Box>
                              <HStack justify="space-between" mb={1}>
                                <Text fontSize="sm">Completeness Score</Text>
                                <Text fontSize="sm" fontWeight="bold">
                                  {score.completenessScore}%
                                </Text>
                              </HStack>
                              <Progress
                                value={score.completenessScore}
                                size="sm"
                                colorScheme={getScoreColor(
                                  score.completenessScore
                                )}
                                borderRadius="full"
                              />
                            </Box>
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              </CardBody>
            </Card>
          )}

          {!comparison && (
            <Alert status="info">
              <AlertIcon />
              Click "Generate AI Comparison" to analyze proposals and get a
              recommendation.
            </Alert>
          )}
        </>
      )}
    </VStack>
  );
};

export default Comparison;
