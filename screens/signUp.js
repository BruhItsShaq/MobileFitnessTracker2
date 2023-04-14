import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Picker } from 'react-native';
import { signUp } from '../firebase/dbRequests';

const SignUp = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [activityLevel, setActivityLevel] = useState('');
    const [goal, setGoal] = useState('');
    const [sleepGoal, setSleepGoal] = useState('');
    const [error, setError] = useState('');
    const [calorieGoal, setCalorieGoal] = useState('');

    const handleSignUp = () => {
        // Validate input
        // if (!email || !password || !username || !age || !gender || !weight || !height || !activityLevel || !goal || !sleepGoal) {
        //     setError('Please fill out all fields');
        //     return;
        // }

        // Make sure age, weight, height, and sleepGoal are numbers
        if (isNaN(age) || isNaN(weight) || isNaN(height) || isNaN(sleepGoal)) {
            setError('Please enter a valid number for age, weight, height, and sleep goal');
            return;
        }

        // Call signUp function and handle errors
        signUp(email, password, username, age, gender, weight, height, activityLevel, goal, sleepGoal, calorieGoal)
            .catch((error) => {
                setError(error.message);
            });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Sign Up</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={(text) => setEmail(text)} />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={(text) => setPassword(text)} secureTextEntry />

            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} value={username} onChangeText={(text) => setUsername(text)} />

            <Text style={styles.label}>Age</Text>
            <TextInput style={styles.inputSmall} value={age} onChangeText={(text) => setAge(text)} keyboardType="numeric" />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.input}>
                <Picker
                    selectedValue={gender}
                    onValueChange={(itemValue) => setGender(itemValue)}
                    style={{ color: '#5c5c5c' }}
                >
                    <Picker.Item label="Male" value="male" />
                    <Picker.Item label="Female" value="female" />
                </Picker>
            </View>

            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput style={styles.inputSmall} value={weight} onChangeText={(text) => setWeight(text)} keyboardType="numeric" />

            <Text style={styles.label}>Height (m)</Text>
            <TextInput style={styles.inputSmall} value={height} onChangeText={(text) => setHeight(text)} keyboardType="numeric" />

            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.input}>
                <Picker
                    selectedValue={activityLevel}
                    onValueChange={(itemValue) => setActivityLevel(itemValue)}
                    style={{ color: '#5c5c5c' }}
                >
                    <Picker.Item label="1 - Lowest active level" value="1" />
                    <Picker.Item label="2" value="2" />
                    <Picker.Item label="3" value="3" />
                    <Picker.Item label="4" value="4" />
                    <Picker.Item label="5" value="5" />
                    <Picker.Item label="6" value="6" />
                    <Picker.Item label="7" value="7" />
                    <Picker.Item label="8" value="8" />
                    <Picker.Item label="9" value="9" />
                    <Picker.Item label="10 - Highest active level" value="10" />
                </Picker>
            </View>

            <Text style={styles.label}>Goal</Text>
            <TextInput style={styles.input} value={goal} onChangeText={(text) => setGoal(text)} />

            <Text style={styles.label}>Sleep Goal (hrs)</Text>
            <TextInput style={styles.inputSmall} value={sleepGoal} onChangeText={(text) => setSleepGoal(text)} keyboardType="numeric" />
           
            <Text style={styles.label}>Calorie goals (kcal)</Text>
            <TextInput style={styles.inputSmall} value={calorieGoal} onChangeText={(text) => setCalorieGoal(text)} keyboardType="numeric" />

            <>
                {error ? <Text style={styles.error}>{error}</Text> : null}
            </>

            <Text style={styles.loginLink}>Already have an account? <Text style={styles.link} onPress={() => navigation.navigate('Login')}>Login here</Text></Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    error: {
        color: 'red',
        fontSize: 16,
        marginBottom: 10,
    },
    heading: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    label: {
        fontSize: 20,
        marginTop: 20,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    input: {
        borderWidth: 1,
        borderColor: '#D3D3D3',
        borderRadius: 5,
        padding: 15,
        width: '100%',
        marginBottom: 20,
        fontSize: 18,
    },
    inputSmall: {
        borderWidth: 1,
        borderColor: '#D3D3D3',
        borderRadius: 5,
        padding: 10,
        width: '40%',
        marginBottom: 20,
        fontSize: 18,
    },
    picker: {
        borderWidth: 1,
        borderColor: '#D3D3D3',
        borderRadius: 5,
        padding: 10,
        width: '100%',
        marginBottom: 20,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
    },
    button: {
        backgroundColor: '#71C3FC',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 5,
        width: '100%',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    loginLink: {
        fontSize: 16,
        marginTop: 20,
        alignSelf: 'center'
    },
    link: {
        color: '#428AF8',
        textDecorationLine: 'underline'
    }
});

export default SignUp;
