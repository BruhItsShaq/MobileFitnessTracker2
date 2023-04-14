import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, } from "react-native";
import { Card, Title, useTheme, TextInput, Button, IconButton, } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Modal from "react-native-modal";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { addNutritionData, addSleepData, getNutritionAndSleepData, updateUserData } from "../firebase/dbRequests";

const DiaryScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [nutritionModalVisible, setNutritionModalVisible] = useState(false);
    const [sleepModalVisible, setSleepModalVisible] = useState(false);
    const [sleepDuration, setSleepDuration] = useState("");
    const [foodItem, setFoodItem] = useState("");
    const [caloriesConsumed, setCaloriesConsumed] = useState("");
    const [mealType, setMealType] = useState("");
    const [servingSize, setServingSize] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [nutritionData, setNutritionData] = useState({});
    const [sleepData, setSleepData] = useState({});

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            const dateStr = selectedDate.toISOString().slice(0, 10);
            const { nutritionData, sleepData } = await getNutritionAndSleepData(
                userId,
                dateStr
            );
            setNutritionData(nutritionData);
            setSleepData(sleepData);
            console.log("Nutrition: ", nutritionData);
            console.log("Sleep", sleepData);
        } catch (error) {
            console.error("Error fetching nutrition and sleep data:", error);
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


    const handleAddNutrition = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            await addNutritionData(
                userId,
                parseInt(caloriesConsumed),
                foodItem,
                mealType,
                parseFloat(servingSize)
            );

            await updateUserData(userId, 0, parseInt(caloriesConsumed), 0);
            
            setNutritionModalVisible(false);
            fetchData();
        } catch (error) {
            console.error("Error adding nutrition data:", error);
        }
    };

    const handleAddSleep = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            await addSleepData(userId, parseInt(sleepDuration));
            setSleepModalVisible(false);
            fetchData();
        } catch (error) {
            console.error("Error adding sleep data:", error);
        }
    };

    const sortedNutritionData = Object.values(nutritionData).sort((a, b) =>
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

            <TouchableOpacity onPress={() => setSleepModalVisible(true)}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Sleep Duration</Title>
                        <Text>{(sleepData && Object.values(sleepData)[0]?.sleep_duration) || 0} Hours</Text>
                    </Card.Content>
                </Card>
            </TouchableOpacity>

            <Modal isVisible={sleepModalVisible}>
                <View style={styles.modalContent}>
                    <TextInput
                        label="Sleep Duration (Hours)"
                        value={sleepDuration}
                        onChangeText={setSleepDuration}
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <Button onPress={handleAddSleep} mode="contained">
                        Add Sleep Data
                    </Button>
                    <Button onPress={() => setSleepModalVisible(false)}>
                        Close
                    </Button>
                </View>
            </Modal>

            <TouchableOpacity onPress={() => setNutritionModalVisible(true)}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Nutrition</Title>
                        {sortedNutritionData.map((entry, index) => (
                            <Text key={index}>
                                {entry.meal_type}: {entry.food_item} ({entry.calories_consumed} kcal)
                            </Text>
                        ))}
                    </Card.Content>
                </Card>
            </TouchableOpacity>

            <Modal isVisible={nutritionModalVisible}>
                <View style={styles.modalContent}>
                    <TextInput
                        label="Food Item"
                        value={foodItem}
                        onChangeText={setFoodItem}
                        style={styles.input}
                    />
                    <TextInput
                        label="Calories Consumed"
                        value={caloriesConsumed}
                        onChangeText={setCaloriesConsumed}
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <TextInput
                        label="Meal Type (e.g. Breakfast, Lunch)"
                        value={mealType}
                        onChangeText={setMealType}
                        style={styles.input}
                    />
                    <TextInput
                        label="Serving Size"
                        value={servingSize}
                        onChangeText={setServingSize}
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <Button onPress={handleAddNutrition} mode="contained">
                        Add Nutrition Data
                    </Button>
                    <Button onPress={() => setNutritionModalVisible(false)}>
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 10,
    },
    dateText: {
        fontSize: 18,
    },
    card: {
        marginHorizontal: 10,
        marginVertical: 5,
    },
    modalContent: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
    },
    input: {
        marginBottom: 10,
    },
});

export default DiaryScreen;