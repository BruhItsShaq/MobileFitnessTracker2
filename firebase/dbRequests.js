import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, push } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
    apiKey: "AIzaSyAShAmJT6R3cEXA5pEeCU4sO-AyGN5ZeFM",
    authDomain: "mobilefitnesstracker-8dae7.firebaseapp.com",
    databaseURL: "https://mobilefitnesstracker-8dae7-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mobilefitnesstracker-8dae7",
    storageBucket: "mobilefitnesstracker-8dae7.appspot.com",
    messagingSenderId: "1006972690213",
    appId: "1:1006972690213:web:d5b8c1fedaf0b6103d04cc",
    measurementId: "G-6XEE145XDZ"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);


export const signUp = async (email, password, username, age, gender, weight, height, activityLevel, goal, sleepGoal, calorieGoal) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Get the user ID from the Firebase Authentication User object
        const userId = userCredential.user.uid;

        // Add the user data to the Firebase Realtime Database
        set(ref(database, 'users/' + userId), {
            activity_level: activityLevel,
            age: age,
            email: email,
            gender: gender,
            goal: goal,
            height: height,
            password_hash: password,
            sleep_goal: sleepGoal,
            username: username,
            weight: weight,
            calorie_goal: calorieGoal
        });
    } catch (error) {
        // Handle errors here
        console.error(error);
        throw error;
    }
};

export const login = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Get the user ID from the Firebase Authentication User object
        const userId = userCredential.user.uid;

        // Store the user ID in AsyncStorage
        await AsyncStorage.setItem('userId', userId);

        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("User is signed in.");
            } else {
                console.log("User is signed out.");
            }
        });

        // Retrieve the user data from the Firebase Realtime Database
        const userRef = ref(database, 'users/' + userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            return userData;
        } else {
            throw new Error("User data not found.");
        }
    } catch (error) {
        // Handle errors here
        console.error(error);
        throw error;
    }
};

const calculateCalorieProgress = (totalCaloriesBurned, caloriesConsumed, calorieGoal) => {
    const caloriesLeft = calorieGoal - caloriesConsumed + totalCaloriesBurned;
    const progress = Math.min(caloriesConsumed / calorieGoal, 1);
    return { caloriesLeft, progress };
};


export const getUserData = async () => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
            throw new Error('User id not found in AsyncStorage.');
        }
        const userRef = ref(database, 'users/' + userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const { total_steps, calorie_goal } = userData;
            const nutritionEntriesRef = ref(database, `user_nutrition/${userId}`);
            const nutritionEntriesSnapshot = await get(nutritionEntriesRef);
            let caloriesConsumedToday = 0;
            if (nutritionEntriesSnapshot.exists()) {
                const nutritionEntries = nutritionEntriesSnapshot.val();
                const today = new Date().toISOString().slice(0, 10);
                Object.values(nutritionEntries).forEach((entry) => {
                    if (entry.timestamp.slice(0, 10) === today) {
                        caloriesConsumedToday += entry.calories_consumed;
                    }
                });
            }
            const workoutEntriesRef = ref(database, `user_workouts/${userId}`);
            const workoutEntriesSnapshot = await get(workoutEntriesRef);
            let caloriesBurnedToday = 0;
            if (workoutEntriesSnapshot.exists()) {
                const workoutEntries = workoutEntriesSnapshot.val();
                const today = new Date().toISOString().slice(0, 10);
                Object.values(workoutEntries).forEach((entry) => {
                    if (entry.timestamp.slice(0, 10) === today) {
                        caloriesBurnedToday += entry.calories_burned;
                    }
                });
            }
            const { caloriesLeft, progress } = calculateCalorieProgress(caloriesBurnedToday, caloriesConsumedToday, calorie_goal);
            return { totalSteps: total_steps, caloriesConsumedToday, caloriesBurnedToday, caloriesLeft, progress, calorie_goal };
        } else {
            throw new Error("User data not found.");
        }
    } catch (error) {
        // Handle errors here
        console.error(error);
        throw error;
    }
};


export const addNutritionData = async (userId, caloriesConsumed, foodItem, mealType, servingSize) => {
    try {
        const nutritionRef = ref(database, `user_nutrition/${userId}`);
        const newNutritionRef = push(nutritionRef);

        const timestamp = new Date().toISOString();
        await set(newNutritionRef, {
            calories_consumed: caloriesConsumed,
            food_item: foodItem,
            meal_type: mealType,
            serving_size: servingSize,
            timestamp: timestamp,
        });

        return newNutritionRef.key;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const addSleepData = async (userId, sleepDuration) => {
    try {
        const sleepRef = ref(database, `user_sleep/${userId}`);
        const newSleepRef = push(sleepRef);

        const timestamp = new Date().toISOString();
        await set(newSleepRef, {
            sleep_duration: sleepDuration,
            timestamp: timestamp,
        });

        return newSleepRef.key;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getNutritionAndSleepData = async (userId, date) => {
    try {
        const nutritionRef = ref(database, `user_nutrition/${userId}`);
        const nutritionSnapshot = await get(nutritionRef);
        const sleepRef = ref(database, `user_sleep/${userId}`);
        const sleepSnapshot = await get(sleepRef);

        const nutritionData = {};
        const sleepData = {};

        if (nutritionSnapshot.exists()) {
            const nutritionEntries = nutritionSnapshot.val();
            Object.entries(nutritionEntries).forEach(([key, entry]) => {
                if (entry.timestamp.slice(0, 10) === date) {
                    nutritionData[key] = entry;
                }
            });
        }

        if (sleepSnapshot.exists()) {
            const sleepEntries = sleepSnapshot.val();
            Object.entries(sleepEntries).forEach(([key, entry]) => {
                if (entry.timestamp.slice(0, 10) === date) {
                    sleepData[key] = entry;
                }
            });
        }

        return { nutritionData, sleepData };
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const updateUserData = async (userId, caloriesBurned, caloriesEaten, steps) => {
    try {
        const functions = getFunctions();
        const updateUserDataCallable = httpsCallable(functions, 'newupdateUserData');
        const response = await updateUserDataCallable({ userId, caloriesBurned, caloriesEaten, steps });
        console.log(response.data);
    } catch (error) {
        console.error('Error calling updateUserData:', error);
    }
};
