import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { IconButton, Button, TextInput, Card, Title } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getStepsAndWorkoutsData, addWorkoutData, addStepsData, updateUserData } from '../firebase/dbRequests';


const WorkoutScreen = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
    const [stepsModalVisible, setStepsModalVisible] = useState(false);
    const [activityType, setActivityType] = useState('');
    const [duration, setDuration] = useState('');
    const [distance, setDistance] = useState('');
    const [caloriesBurned, setCaloriesBurned] = useState('');
    const [stepsTaken, setStepsTaken] = useState('');
    //   const [userData, setUserData] = useState([]);
    const [stepData, setStepData] = useState({});
    const [workoutData, setWorkoutData] = useState({});
    const [workoutError, setWorkoutError] = useState('');
    const [stepsError, setStepsError] = useState('');

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            const dateStr = selectedDate.toISOString().slice(0, 10);
            const { stepData, workoutData } = await getStepsAndWorkoutsData(userId, dateStr);
            //   setUserData(data);
            setStepData(stepData);
            setWorkoutData(workoutData);
            console.log("Step Data:", stepData);
            console.log("Workout Data:", workoutData);
        } catch (error) {
            console.error('Error fetching workout and steps data:', error);
        }
    };

    const handleDateChange = (event, date) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    const renderDatePicker = () => {
        if (showDatePicker) {
            return (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    onTouchCancel={() => setShowDatePicker(false)}
                />
            );
        }
        return null;
    };

    const isAlphabetic = (str) => /^[a-zA-Z\s]+$/.test(str);
    const isNumeric = (str) => /^[0-9]+(\.[0-9]+)?$/.test(str);

    const validateWorkoutInput = () => {
        setWorkoutError('');
        if (activityType.trim() === '' || !isAlphabetic(activityType)) {
            setWorkoutError('Workout type is required and must only contain letters');
            return false;
        }
        if (!isNumeric(duration)) {
            setWorkoutError('Duration must be a number');
            return false;
        }
        if (!isNumeric(distance)) {
            setWorkoutError('Distance must be a number');
            return false;
        }
        if (!isNumeric(caloriesBurned)) {
            setWorkoutError('Calories burned must be a number');
            return false;
        }
        return true;
    };

    const validateStepsInput = () => {
        setStepsError('');
        if (!isNumeric(stepsTaken)) {
            setStepsError('Steps taken must be a number');
            return false;
        }
        return true;
    };
    const handleAddWorkout = async () => {
        if (!validateWorkoutInput()) return;

        try {
            const userId = await AsyncStorage.getItem('userId');
            await addWorkoutData(
                userId,
                activityType,
                parseInt(duration),
                parseFloat(distance),
                parseInt(caloriesBurned)
            );

            await updateUserData(userId, parseInt(caloriesBurned), 0, 0);

            setWorkoutModalVisible(false);
            fetchData();
        } catch (error) {
            console.error('Error adding workout data:', error);
        }
    };

    const handleAddSteps = async () => {
        if (!validateStepsInput()) return;

        try {
            const userId = await AsyncStorage.getItem('userId');
            await addStepsData(userId, parseInt(stepsTaken));

            await updateUserData(userId, 0, 0, parseInt(stepsTaken));

            setStepsModalVisible(false);
            fetchData();
        } catch (error) {
            console.error('Error adding steps data:', error);
        }
    };
    const sortedStepData = Object.values(stepData).sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
    );

    const sortedWorkoutData = Object.values(workoutData).sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.datePickerContainer}>
                <IconButton
                    icon="chevron-left"
                    onPress={() =>
                        setSelectedDate(
                            new Date(selectedDate.setDate(selectedDate.getDate() - 1))
                        )
                    }
                />
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
                </TouchableOpacity>
                <IconButton
                    icon="chevron-right"
                    onPress={() =>
                        setSelectedDate(
                            new Date(selectedDate.setDate(selectedDate.getDate() + 1))
                        )
                    }
                />
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            <TouchableOpacity onPress={() => setStepsModalVisible(true)}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Steps</Title>
                        {sortedStepData.map((entry, index) => (
                            <Text key={index}>
                                {entry.steps_count} steps
                            </Text>
                        ))}
                    </Card.Content>
                </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setWorkoutModalVisible(true)}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Workout</Title>
                        {sortedWorkoutData.map((entry, index) => (
                            <Text key={index}>
                                {entry.activity_type}: {entry.duration} minutes ({entry.calories_burned} kcal)
                            </Text>
                        ))}
                    </Card.Content>
                </Card>
            </TouchableOpacity>


            {/* <View style={styles.addButtonContainer}>
                <Button icon="run" mode="contained" onPress={() => setWorkoutModalVisible(true)}>
                    Workout
                </Button>
                <Button icon="walk" mode="contained" onPress={() => setStepsModalVisible(true)}>
                    Steps
                </Button>
            </View> */}
            <Modal isVisible={workoutModalVisible}>
                <View style={styles.modalContent}>
                    {workoutError ? <Text style={styles.error}>{workoutError}</Text> : null}
                    <TextInput
                        label="Activity Type"
                        value={activityType}
                        onChangeText={setActivityType}
                        style={styles.input}
                    />
                    <TextInput
                        label="Duration (Minutes)"
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <TextInput
                        label="Distance (Miles)"
                        value={distance}
                        onChangeText={setDistance}
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <TextInput
                        label="Calories Burned"
                        value={caloriesBurned}
                        onChangeText={setCaloriesBurned}
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <Button onPress={handleAddWorkout} mode="contained">
                        Add Workout Data
                    </Button>
                    <Button onPress={() => setWorkoutModalVisible(false)}>
                        Close
                    </Button>
                </View>
            </Modal>

            <Modal isVisible={stepsModalVisible}>
                <View style={styles.modalContent}>
                    {stepsError ? <Text style={styles.error}>{stepsError}</Text> : null}
                    <TextInput
                        label="Steps Taken"
                        value={stepsTaken}
                        onChangeText={setStepsTaken}
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <Button onPress={handleAddSteps} mode="contained">
                        Add Steps Data
                    </Button>
                    <Button onPress={() => setStepsModalVisible(false)}>
                        Close
                    </Button>
                </View>
            </Modal>
            {renderDatePicker()}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    datePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    dateText: {
        fontSize: 18,
    },
    addButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 10,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
    },
    input: {
        marginBottom: 10,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    activityType: {
        fontWeight: 'bold',
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
    },
    distance: {
        color: 'blue',
    },
    duration: {
        color: 'green',
    },
    caloriesBurned: {
        color: 'red',
    },
    stepsTaken: {
        color: 'purple',
    },
    error: {
        color: 'red',
        marginTop: 8,
    },
});

export default WorkoutScreen;
