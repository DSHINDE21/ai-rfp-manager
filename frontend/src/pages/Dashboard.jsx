import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardBody,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  VStack,
  HStack,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { rfpApi, vendorApi, proposalApi } from "../services/api";

const Dashboard = () => {
  const [stats, setStats] = useState({
    rfps: 0,
    vendors: 0,
    proposals: 0,
  });
  const [recentRFPs, setRecentRFPs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [rfpsRes, vendorsRes] = await Promise.all([
        rfpApi.getAll(),
        vendorApi.getAll(),
      ]);

      const rfpsList = rfpsRes?.data?.data || rfpsRes?.data || [];
      const rfps = Array.isArray(rfpsList) ? rfpsList : [];

      const vendorsList = vendorsRes?.data?.data || vendorsRes?.data || [];
      const vendors = Array.isArray(vendorsList) ? vendorsList : [];

      let proposalCount = 0;
      try {
        const proposalPromises = rfps.map((rfp) =>
          proposalApi.getByRFP(rfp._id).catch(() => ({ data: { data: [] } }))
        );
        const proposalResults = await Promise.all(proposalPromises);
        proposalCount = proposalResults.reduce(
          (sum, res) => sum + (res.data.data?.length || res.data.length || 0),
          0
        );
      } catch (err) {
        console.error("Error counting proposals:", err);
      }

      setStats({
        rfps: rfps.length,
        vendors: vendors.length,
        proposals: proposalCount,
      });

      const sortedRFPs = rfps
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentRFPs(sortedRFPs);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">Dashboard</Heading>

      <Grid templateColumns="repeat(3, 1fr)" gap={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total RFPs</StatLabel>
              <StatNumber>{stats.rfps}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Vendors</StatLabel>
              <StatNumber>{stats.vendors}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Proposals</StatLabel>
              <StatNumber>{stats.proposals}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      <Card>
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Heading size="md">Recent RFPs</Heading>
            <Button as={RouterLink} to="/create-rfp" colorScheme="blue">
              Create New RFP
            </Button>
          </HStack>
          {loading ? (
            <Text>Loading...</Text>
          ) : recentRFPs.length === 0 ? (
            <Text color="gray.500">No RFPs yet. Create your first RFP!</Text>
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Title</Th>
                    <Th>Status</Th>
                    <Th>Budget</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recentRFPs.map((rfp) => (
                    <Tr key={rfp._id}>
                      <Td>{rfp.title}</Td>
                      <Td>{rfp.status}</Td>
                      <Td>${rfp.budget?.toLocaleString() || "N/A"}</Td>
                      <Td>{new Date(rfp.createdAt).toLocaleDateString()}</Td>
                      <Td>
                        <Button
                          as={RouterLink}
                          to={`/rfps/${rfp._id}`}
                          size="sm"
                          colorScheme="blue"
                          mr={2}
                        >
                          View
                        </Button>
                        <Button
                          as={RouterLink}
                          to={`/comparison/${rfp._id}`}
                          size="sm"
                          colorScheme="purple"
                        >
                          Compare
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>
    </VStack>
  );
};

export default Dashboard;
