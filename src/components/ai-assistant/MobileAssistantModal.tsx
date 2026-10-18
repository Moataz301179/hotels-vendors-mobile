// Mobile AI Assistant Modal Component
import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

const ASSISTANT_QUESTIONS = [
  "How do I create an account?",
  "How does the 48-hour payment work?",
  "What is the credit limit?",
  "What documents do I need?",
  "How do I verify my tax ID?",
  "What is CHV000?",
  "How do I connect my ETA token?",
];

type AssistantModalProps = {
  visible: boolean;
  onClose: () => void;
  onAnswer: (question: string) => void;
};

export function MobileOnboardingAssistant({ visible, onClose, onAnswer }: AssistantModalProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modal}>
          <Text style={styles.title}>AI Onboarding Assistant</Text>
          <Text style={styles.subtitle}>How can I help you?</Text>
          
          <ScrollView style={styles.questions} showsVerticalScrollIndicator={false}>
            {ASSISTANT_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.question}
                onPress={() => {
                  setSelectedQuestion(q);
                  onAnswer(q);
                }}
              >
                <Text style={styles.questionText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    backgroundColor: "#0B0F14",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#ADA294",
    marginBottom: 16,
  },
  questions: {
    maxHeight: 300,
  },
  question: {
    backgroundColor: "#12121a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#314B43",
  },
  questionText: {
    color: "#ffffff",
    fontSize: 14,
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#314B43",
    borderRadius: 8,
  },
  closeText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
});
