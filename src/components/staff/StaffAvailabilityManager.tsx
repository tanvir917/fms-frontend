import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  Chip,
  IconButton,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import {
  staffService,
  StaffProfile,
  StaffAvailability,
  CreateStaffAvailabilityRequest,
  UpdateStaffAvailabilityRequest
} from '../../services/staffService';

interface StaffAvailabilityManagerProps {
  staffProfiles: StaffProfile[];
  onUpdate: () => void;
}

interface AvailabilityFormData {
  dayOfWeek: string;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  isAvailable: boolean;
  notes?: string;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const StaffAvailabilityManager: React.FC<StaffAvailabilityManagerProps> = ({
  staffProfiles,
  onUpdate,
}) => {
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [availabilities, setAvailabilities] = useState<Record<number, StaffAvailability[]>>({});
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<StaffAvailability | null>(null);
  const [formData, setFormData] = useState<AvailabilityFormData>({
    dayOfWeek: '',
    startTime: null,
    endTime: null,
    isAvailable: true,
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (staffProfiles.length > 0) {
      loadAllAvailabilities();
    }
  }, [staffProfiles]);

  const loadAllAvailabilities = async () => {
    setLoading(true);
    try {
      const availabilityPromises = staffProfiles.map(async (staff) => {
        try {
          const availability = await staffService.getStaffAvailability(staff.id);
          return { staffId: staff.id, availability };
        } catch (error) {
          console.warn(`Failed to load availability for staff ${staff.id}:`, error);
          return { staffId: staff.id, availability: [] };
        }
      });

      const results = await Promise.all(availabilityPromises);
      const availabilityMap: Record<number, StaffAvailability[]> = {};

      results.forEach(({ staffId, availability }) => {
        availabilityMap[staffId] = availability;
      });

      setAvailabilities(availabilityMap);
    } catch (error) {
      console.error('Error loading availabilities:', error);
      setError('Failed to load staff availabilities');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffAvailability = async (staffId: number) => {
    try {
      const availability = await staffService.getStaffAvailability(staffId);
      setAvailabilities(prev => ({
        ...prev,
        [staffId]: availability
      }));
    } catch (error) {
      console.error(`Error loading availability for staff ${staffId}:`, error);
    }
  };

  const handleOpenDialog = (staff: StaffProfile, availability?: StaffAvailability) => {
    setSelectedStaff(staff);
    setSelectedAvailability(availability || null);

    if (availability) {
      setFormData({
        dayOfWeek: availability.dayOfWeek,
        startTime: availability.startTime ? dayjs(availability.startTime, 'HH:mm') : null,
        endTime: availability.endTime ? dayjs(availability.endTime, 'HH:mm') : null,
        isAvailable: availability.isAvailable,
        notes: availability.notes || '',
      });
    } else {
      setFormData({
        dayOfWeek: '',
        startTime: null,
        endTime: null,
        isAvailable: true,
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStaff(null);
    setSelectedAvailability(null);
    setFormData({
      dayOfWeek: '',
      startTime: null,
      endTime: null,
      isAvailable: true,
      notes: '',
    });
    setError(null);
  };

  const handleSave = async () => {
    if (!selectedStaff || !formData.dayOfWeek) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // Convert time strings to TimeSpan format that .NET expects
      const startTimeString = formData.startTime ? formData.startTime.format('HH:mm:ss') : '09:00:00';
      const endTimeString = formData.endTime ? formData.endTime.format('HH:mm:ss') : '17:00:00';

      const availabilityData = {
        dayOfWeek: formData.dayOfWeek,
        startTime: startTimeString,
        endTime: endTimeString,
        isAvailable: formData.isAvailable,
        notes: formData.notes || undefined,
      };

      if (selectedAvailability) {
        await staffService.updateStaffAvailability(
          selectedStaff.id,
          selectedAvailability.id,
          availabilityData as UpdateStaffAvailabilityRequest
        );
        setSuccess('Availability updated successfully');
      } else {
        await staffService.createStaffAvailability(
          selectedStaff.id,
          availabilityData as CreateStaffAvailabilityRequest
        );
        setSuccess('Availability created successfully');
      }

      await loadStaffAvailability(selectedStaff.id);
      handleCloseDialog();
      onUpdate();
    } catch (error: any) {
      console.error('Error saving availability:', error);
      setError(error.response?.data?.message || 'Failed to save availability');
    }
  };

  const handleDelete = async (staffId: number, availabilityId: number) => {
    if (!window.confirm('Are you sure you want to delete this availability?')) {
      return;
    }

    try {
      await staffService.deleteStaffAvailability(staffId, availabilityId);
      await loadStaffAvailability(staffId);
      setSuccess('Availability deleted successfully');
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting availability:', error);
      setError(error.response?.data?.message || 'Failed to delete availability');
    }
  };

  const getAvailabilityColor = (isAvailable: boolean) => {
    return isAvailable ? 'success' : 'error';
  };

  const getDayAvailabilityStatus = (staffId: number, day: string) => {
    const staffAvailabilities = availabilities[staffId] || [];
    const dayAvailability = staffAvailabilities.find(a => a.dayOfWeek === day);

    if (!dayAvailability) {
      return { status: 'not-set', label: 'Not Set', color: 'default' as const };
    }

    if (dayAvailability.isAvailable) {
      return {
        status: 'available',
        label: `${dayAvailability.startTime} - ${dayAvailability.endTime}`,
        color: 'success' as const
      };
    } else {
      return { status: 'unavailable', label: 'Unavailable', color: 'error' as const };
    }
  };

  const getStaffWeekSummary = (staffId: number) => {
    const staffAvailabilities = availabilities[staffId] || [];
    const availableDays = staffAvailabilities.filter(a => a.isAvailable).length;
    const totalDays = DAYS_OF_WEEK.length;

    return {
      availableDays,
      totalDays,
      percentage: totalDays > 0 ? Math.round((availableDays / totalDays) * 100) : 0
    };
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Staff Availability Management
          </Typography>
        </Stack>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          {staffProfiles.map((staff) => {
            const summary = getStaffWeekSummary(staff.id);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={staff.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <PersonIcon color="primary" />
                      <Typography variant="h6" noWrap>
                        {staff.firstName} {staff.lastName}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {staff.position} • {staff.department}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <Typography variant="body2">
                        Available: {summary.availableDays}/{summary.totalDays} days
                      </Typography>
                      <Chip
                        label={`${summary.percentage}%`}
                        color={summary.percentage >= 70 ? 'success' : summary.percentage >= 40 ? 'warning' : 'error'}
                        size="small"
                      />
                    </Stack>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog(staff)}
                      variant="outlined"
                      fullWidth
                    >
                      Manage Schedule
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Detailed Availability Table */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Availability Overview
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  {DAYS_OF_WEEK.map((day) => (
                    <TableCell key={day.value} align="center">
                      {day.label}
                    </TableCell>
                  ))}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffProfiles.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2" fontWeight="medium">
                          {staff.firstName} {staff.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {staff.employeeId} • {staff.position}
                        </Typography>
                      </Stack>
                    </TableCell>
                    {DAYS_OF_WEEK.map((day) => {
                      const dayStatus = getDayAvailabilityStatus(staff.id, day.value);
                      const dayAvailability = (availabilities[staff.id] || []).find(a => a.dayOfWeek === day.value);

                      return (
                        <TableCell key={day.value} align="center">
                          <Stack spacing={0.5} alignItems="center">
                            <Chip
                              label={dayStatus.label}
                              color={dayStatus.color}
                              size="small"
                              sx={{ minWidth: 80, fontSize: '0.7rem' }}
                            />
                            {dayAvailability && (
                              <Stack direction="row" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(staff, dayAvailability)}
                                >
                                  <EditIcon fontSize="inherit" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(staff.id, dayAvailability.id)}
                                >
                                  <DeleteIcon fontSize="inherit" />
                                </IconButton>
                              </Stack>
                            )}
                          </Stack>
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog(staff)}
                        variant="outlined"
                      >
                        Add Slot
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Availability Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedAvailability ? 'Edit Availability' : 'Add Availability'}
            {selectedStaff && (
              <Typography variant="subtitle1" color="text.secondary">
                {selectedStaff.firstName} {selectedStaff.lastName}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      {day.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  />
                }
                label="Available on this day"
              />

              {formData.isAvailable && (
                <Stack direction="row" spacing={2}>
                  <TimePicker
                    label="Start Time"
                    value={formData.startTime}
                    onChange={(newValue) => setFormData({ ...formData, startTime: newValue })}
                    sx={{ flex: 1 }}
                  />
                  <TimePicker
                    label="End Time"
                    value={formData.endTime}
                    onChange={(newValue) => setFormData({ ...formData, endTime: newValue })}
                    sx={{ flex: 1 }}
                  />
                </Stack>
              )}

              <TextField
                label="Notes (Optional)"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special notes about availability on this day..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              {selectedAvailability ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default StaffAvailabilityManager;
