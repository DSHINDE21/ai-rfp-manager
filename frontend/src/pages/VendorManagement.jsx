import { useState, useEffect, useCallback } from "react";
import * as yup from "yup";
import {
  Box,
  VStack,
  Heading,
  Button,
  Card,
  CardBody,
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
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Alert,
  AlertIcon,
  Text,
} from "@chakra-ui/react";
import { vendorApi } from "../services/api";

// Validation schema
const vendorSchema = yup.object({
  name: yup
    .string()
    .required("Vendor name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address"),
  contactInfo: yup
    .string()
    .max(200, "Contact info must be less than 200 characters"),
});

const VendorManagement = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactInfo: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchVendors = async () => {
    try {
      const response = await vendorApi.getAll();
      const vendorsList = response?.data?.data || response?.data || [];
      // Ensure vendors is always an array
      setVendors(Array.isArray(vendorsList) ? vendorsList : []);
    } catch (err) {
      setError("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const validateField = useCallback(async (field, value) => {
    try {
      await vendorSchema.validateAt(field, { [field]: value });
      setErrors((prev) => ({ ...prev, [field]: "" }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, [field]: err.message }));
    }
  }, []);

  const validateForm = async () => {
    try {
      await vendorSchema.validate(formData, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      const newErrors = {};
      err.inner.forEach((e) => {
        newErrors[e.path] = e.message;
      });
      setErrors(newErrors);
      // Mark all fields as touched
      setTouched({ name: true, email: true, contactInfo: true });
      return false;
    }
  };

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setFormData({ name: "", email: "", contactInfo: "" });
    setErrors({});
    setTouched({});
    setError(null);
    onOpen();
  };

  const handleOpenEdit = (vendor) => {
    setEditingVendor(vendor);
    // Handle contactInfo as object or string
    let contactInfoStr = "";
    if (typeof vendor.contactInfo === "object" && vendor.contactInfo) {
      contactInfoStr =
        vendor.contactInfo.phone || vendor.contactInfo.address || "";
    } else {
      contactInfoStr = vendor.contactInfo || "";
    }
    setFormData({
      name: vendor.name,
      email: vendor.email,
      contactInfo: contactInfoStr,
    });
    setErrors({});
    setTouched({});
    setError(null);
    onOpen();
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleFieldBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleSubmit = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setSubmitting(true);
    setError(null);
    try {
      if (editingVendor) {
        await vendorApi.update(editingVendor._id, formData);
        setSuccessMessage("Vendor updated successfully!");
      } else {
        await vendorApi.create(formData);
        setSuccessMessage("Vendor created successfully!");
      }
      await fetchVendors();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        await vendorApi.delete(id);
        setSuccessMessage("Vendor deleted successfully!");
        await fetchVendors();
      } catch (err) {
        setError("Failed to delete vendor");
      }
    }
  };

  const isFormValid =
    formData.name.trim() &&
    formData.email.trim() &&
    !errors.name &&
    !errors.email;

  return (
    <VStack spacing={6} align="stretch">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="lg">Vendor Management</Heading>
        <Button onClick={handleOpenAdd} colorScheme="blue">
          Add Vendor
        </Button>
      </Box>

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

      <Card>
        <CardBody>
          {loading ? (
            <Box>Loading...</Box>
          ) : vendors.length === 0 ? (
            <Box textAlign="center" py={8} color="gray.500">
              No vendors yet. Add your first vendor!
            </Box>
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Contact Info</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {vendors?.map((vendor) => (
                    <Tr key={vendor._id}>
                      <Td>{vendor.name}</Td>
                      <Td>{vendor.email}</Td>
                      <Td>
                        {typeof vendor.contactInfo === "object"
                          ? vendor.contactInfo?.phone ||
                            vendor.contactInfo?.address ||
                            "N/A"
                          : vendor.contactInfo || "N/A"}
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          mr={2}
                          onClick={() => handleOpenEdit(vendor)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDelete(vendor._id)}
                        >
                          Delete
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

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingVendor ? "Edit Vendor" : "Add Vendor"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={touched.name && !!errors.name} isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  onBlur={() => handleFieldBlur("name")}
                  placeholder="Vendor name"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={touched.email && !!errors.email}
                isRequired
              >
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  onBlur={() => handleFieldBlur("email")}
                  placeholder="vendor@example.com"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={touched.contactInfo && !!errors.contactInfo}
              >
                <FormLabel>
                  Contact Info{" "}
                  <Text as="span" color="gray.500" fontWeight="normal">
                    (Optional)
                  </Text>
                </FormLabel>
                <Input
                  value={formData.contactInfo}
                  onChange={(e) =>
                    handleFieldChange("contactInfo", e.target.value)
                  }
                  onBlur={() => handleFieldBlur("contactInfo")}
                  placeholder="Phone, address, etc."
                />
                <FormErrorMessage>{errors.contactInfo}</FormErrorMessage>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={submitting}
              isDisabled={!isFormValid}
            >
              {editingVendor ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default VendorManagement;
