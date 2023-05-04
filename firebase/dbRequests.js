import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, push, query, orderByChild, startAt, endAt, update } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

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
            calorie_goal: calorieGoal,
            total_calories_burned: 0,
            total_calories_eaten: 0,
            total_steps: 0
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

const getSleepDataToday = async () => {
    const userId = await AsyncStorage.getItem('userId');

    const sleepRef = ref(database, `user_sleep/${userId}`);

    const snapshot = await get(sleepRef);

    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'day');

    let sleepDurationToday = 0;
    snapshot.forEach((childSnapshot) => {
        const childData = childSnapshot.val();
        const sleepMoment = moment(childData.timestamp);

        if (sleepMoment.isSameOrAfter(today) && sleepMoment.isBefore(tomorrow)) {
            sleepDurationToday += childData.sleep_duration;
        }
    });

    console.log('sleepDurationToday:', sleepDurationToday);
    return sleepDurationToday;
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
            const {
                username,
                email,
                gender,
                goal,
                height,
                password,
                weight,
                calorie_goal,
                sleep_goal,
                total_steps,
                total_calories_burned,
                total_calories_eaten,
            } = userData;

            const sleepDurationToday = await getSleepDataToday();
            const sleepProgress = Math.min(sleepDurationToday / userData.sleep_goal, 1);

            const caloriesBurnedToday = total_calories_burned;
            const caloriesConsumedToday = total_calories_eaten;

            const { caloriesLeft, progress } = calculateCalorieProgress(caloriesBurnedToday, caloriesConsumedToday, calorie_goal);
            return {
                username,
                email,
                gender,
                goal,
                height,
                password,
                weight,
                calorie_goal,
                sleep_goal,
                totalSteps: total_steps,
                caloriesConsumedToday,
                caloriesBurnedToday,
                caloriesLeft,
                progress,
                sleepDurationToday,
                sleepProgress
            };
        } else {
            throw new Error("User data not found.");
        }
    } catch (error) {
        // Handle errors here
        console.error(error);
        throw error;
    }
};

export const editUserData = async (updatedUserData) => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
            throw new Error('User id not found in AsyncStorage.');
        }

        const userRef = ref(database, 'users/' + userId);

        await update(userRef, updatedUserData);

    } catch (error) {
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

export const addStepsData = async (userId, stepsCount) => {
    try {
        const stepsRef = ref(database, `user_steps/${userId}`);
        const newStepsRef = push(stepsRef);

        const timestamp = new Date().toISOString();
        await set(newStepsRef, {
            steps_count: stepsCount,
            timestamp: timestamp,
        });

        return newStepsRef.key;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Add workout data
export const addWorkoutData = async (userId, activityType, caloriesBurned, distance, duration) => {
    try {
        const workoutsRef = ref(database, `user_workouts/${userId}`);
        const newWorkoutRef = push(workoutsRef);

        const timestamp = new Date().toISOString();
        await set(newWorkoutRef, {
            activity_type: activityType,
            calories_burned: caloriesBurned,
            distance: distance,
            duration: duration,
            timestamp: timestamp,
        });

        return newWorkoutRef.key;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Get steps and workouts data for a specific date
export const getStepsAndWorkoutsData = async (userId, date) => {
    try {
        const stepsRef = ref(database, `user_steps/${userId}`);
        const stepsSnapshot = await get(stepsRef);
        const workoutsRef = ref(database, `user_workouts/${userId}`);
        const workoutsSnapshot = await get(workoutsRef);

        const stepData = {};
        const workoutData = {};

        if (stepsSnapshot.exists()) {
            const stepsEntries = stepsSnapshot.val();
            Object.entries(stepsEntries).forEach(([key, entry]) => {
                if (entry.timestamp.slice(0, 10) === date) {
                    stepData[key] = entry;
                }
            });
        }

        if (workoutsSnapshot.exists()) {
            const workoutEntries = workoutsSnapshot.val();
            Object.entries(workoutEntries).forEach(([key, entry]) => {
                if (entry.timestamp.slice(0, 10) === date) {
                    workoutData[key] = entry;
                }
            });
        }

        return { stepData, workoutData };
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};