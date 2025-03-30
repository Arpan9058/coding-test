const codingQuestions = {
    1: {
        id: 1,
        title: "Four Sum Problem",
        description: "Given an array of integers, return all unique quadruplets [nums[a], nums[b], nums[c], nums[d]] such that their sum equals the target.",
        skeletonCode: {
            Java: `
            public class Solution {
                public int[][] fourSum(int[] nums, int target) {
                    // Your code here
                }
            }`,
            Python: `
            def fourSum(nums, target):
                # Your code here
                return []`,
            C: `
            #include <stdio.h>
            #include <stdlib.h>
            void fourSum(int nums[], int n, int target) {
                // Your code here
            }`,
            Cpp: `
            #include <iostream>
            #include <vector>
            using namespace std;
            vector<vector<int>> fourSum(vector<int>& nums, int target) {
                // Your code here
                return {};
            }`
        },
        testCases: [
            { input: "[1,0,-1,0,-2,2], target = 0", expectedOutput: "[[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]]" },
            { input: "[2,2,2,2,2], target = 8", expectedOutput: "[[2, 2, 2, 2]]" }
        ]
    },
    2: {
        id: 2,
        title: "Subarray Product Less Than K",
        description: "Return the number of contiguous subarrays where the product of all the elements is strictly less than k.",
        skeletonCode: {
            Java: `
            public class Solution {
                public int numSubarrayProductLessThanK(int[] nums, int k) {
                    // Your code here
                    return 0;
                }
            }`,
            Python: `
            def numSubarrayProductLessThanK(nums, k):
                # Your code here
                return 0`,
            C: `
            #include <stdio.h>
            int numSubarrayProductLessThanK(int nums[], int n, int k) {
                // Your code here
                return 0;
            }`,
            Cpp: `
            #include <iostream>
            #include <vector>
            using namespace std;
            int numSubarrayProductLessThanK(vector<int>& nums, int k) {
                // Your code here
                return 0;
            }`
        },
        testCases: [
            { input: "[10, 5, 2, 6], k = 100", expectedOutput: "8" },
            { input: "[1, 2, 3], k = 0", expectedOutput: "0" }
        ]
    },
    3: {
        id: 3,
        title: "Add Two Numbers (Linked Lists)",
        description: "Add two numbers represented as linked lists in reverse order and return the sum as a linked list.",
        skeletonCode: {
            Java: `
            public class Solution {
                public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
                    // Your code here
                    return null;
                }
            }`,
            Python: `
            class ListNode:
                def __init__(self, val=0, next=None):
                    self.val = val
                    self.next = next

            def addTwoNumbers(l1, l2):
                # Your code here
                return None`,
            C: `
            #include <stdio.h>
            struct ListNode {
                int val;
                struct ListNode* next;
            };

            struct ListNode* addTwoNumbers(struct ListNode* l1, struct ListNode* l2) {
                // Your code here
                return NULL;
            }`,
            Cpp: `
            #include <iostream>
            using namespace std;

            struct ListNode {
                int val;
                ListNode* next;
                ListNode(int x) : val(x), next(NULL) {}
            };

            ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
                // Your code here
                return nullptr;
            }`
        },
        testCases: [
            { input: "[2, 4, 3], [5, 6, 4]", expectedOutput: "[7, 0, 8]" },
            { input: "[0], [0]", expectedOutput: "[0]" }
        ]
    }
};
