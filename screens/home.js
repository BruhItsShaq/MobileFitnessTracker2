import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { Card, Title, Caption, useTheme } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getUserData } from '../firebase/dbRequests';

const CustomProgressBar = ({ progress, color, style }) => {
    console.log('Sleep progress:', progress);
    const [animatedValue] = useState(new Animated.Value(0));
    const [scaleValue] = useState(new Animated.Value(1));
    const [spinValue] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false,
        }).start(() => {
            if (progress === 1) {
                Animated.sequence([
                    Animated.timing(scaleValue, {
                        toValue: 1.1,
                        duration: 300,
                        useNativeDriver: false,
                    }),
                    Animated.timing(scaleValue, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: false,
                    }),
                ]).start();

                Animated.loop(
                    Animated.timing(spinValue, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    })
                ).start();
            }
        });
    }, [progress]);

    const width = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={[style, { backgroundColor: '#eee', borderRadius: 5 }]}>
            <Animated.View
                style={[
                    {
                        width,
                        backgroundColor: color,
                        height: '100%',
                        borderRadius: 5,
                        transform: [{ scaleX: scaleValue }],
                    },
                ]}
            />
            {progress === 1 && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: -35,
                        left: '60%',
                        marginLeft: -12.5,
                        transform: [{ rotate: spin }],
                    }}
                >
                    <Icon name="trophy" size={30} color="#f1c40f" />
                </Animated.View>
            )}
        </View>
    );
};

const HomeScreen = () => {
    const navigation = useNavigation();
    const [userData, setUserData] = useState({
        totalSteps: 0,
        caloriesConsumedToday: 0,
        caloriesBurnedToday: 0,
        caloriesLeft: 0,
        progress: 0,
        calorie_goal: 0,
        sleep_goal: 0,
        sleepDurationToday: 0,
        sleepProgress: 0,
    });

    const { colors } = useTheme();

    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                try {
                    const data = await getUserData();
                    setUserData(data);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            };

            fetchData();

            return () => { }; // Return an empty cleanup function.
        }, [])
    );


    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Calories</Title>
                    <Caption>Goal: {userData.calorie_goal} kcal</Caption>
                    <Caption>Calories remaining: {userData.caloriesLeft} kcal</Caption>
                    <CustomProgressBar
                        progress={userData.progress}
                        color={colors.primary}
                        style={styles.progressBar}
                    />
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => navigation.navigate('Diary')}
                    >
                        <Text style={styles.rowText}>
                            Food: {userData.caloriesConsumedToday} kcal
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => navigation.navigate('Workout')}
                    >
                        <Text style={styles.rowText}>
                            Exercise: {userData.caloriesBurnedToday} kcal
                        </Text>
                    </TouchableOpacity>
                </Card.Content>
            </Card>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Sleep</Title>
                    <Caption>Goal: {userData.sleep_goal} hours</Caption>
                    <Caption>Duration: {userData.sleepDurationToday} hours</Caption>
                    <CustomProgressBar
                        progress={userData.sleepProgress}
                        color={colors.primary}
                        style={styles.progressBar}
                    />
                </Card.Content>
            </Card>
            <TouchableOpacity onPress={() => navigation.navigate('Diary')}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Food Today</Title>
                        <Text>{userData.caloriesConsumedToday} kcal</Text>
                    </Card.Content>
                </Card>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Workout')}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Exercise Today</Title>
                        <Text>{userData.caloriesBurnedToday} kcal</Text>
                    </Card.Content>
                </Card>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Workout')}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Total Steps</Title>
                        <Text>{userData.totalSteps}</Text>
                    </Card.Content>
                </Card>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    card: {
        marginBottom: 10,
        borderRadius: 10,
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    column: {
        alignItems: 'center',
    },
    number: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
